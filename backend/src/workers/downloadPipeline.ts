// Modul inti pipeline download. Mendalam: satu interface (processJob), seluruh alur
// download/trim/upload/notifikasi ada di dalam — caller tak perlu tahu tahapannya.
//
// Adapter (lihat types/pipeline.ts) di-inject lewat factory:
//   downloader (yt-dlp), trimmer (ffmpeg), uploader (Google Drive),
//   emitter (Socket.IO), store (Prisma). Test memakai stub → tak ada shell-out,
//   jaringan, atau Redis. Error user-facing dari yt-dlp sudah berupa pesan
//   terjemahan di dalam YtDlpError (extends Error) → cukup baca err.message.
import { rm } from 'node:fs/promises';
import path from 'node:path';
import type {
  FileUploader,
  JobStore,
  PipelineEmitter,
  PipelineJob,
  VideoDownloader,
  VideoTrimmer,
} from '../types/pipeline.js';
import type { BatchSentinel } from './batchSentinel.js';

const TMP_DIR = path.resolve('tmp');

type PipelineDeps = {
  downloader: VideoDownloader;
  trimmer: VideoTrimmer;
  uploader: FileUploader;
  emitter: PipelineEmitter;
  store: JobStore;
  sentinel: BatchSentinel;
};

/** Interface publik pipeline: proses satu job dari queue. */
export type DownloadPipeline = {
  processJob(data: { jobId: string; projectId: string; userId: string }): Promise<void>;
};

/** Bangun pipeline dengan adapter ter-inject. Satu-satunya tempat logic pipeline tinggal. */
export function createDownloadPipeline(deps: PipelineDeps): DownloadPipeline {
  /** Emit event job:progress ke user (via adapter emitter). */
  function emitProgress(job: PipelineJob, percent: number, stage: string) {
    deps.emitter.progress(job.project.userId, job.id, job.projectId, percent, stage);
  }

  /** Cek status job terkini dari store (guard cancel saat proses berjalan). */
  async function isCancelled(jobId: string) {
    const current = await deps.store.findById(jobId);
    return current?.status === 'cancelled';
  }

  // Download segmen (range) saja — tidak pernah download full.
  // Attempt 1: --force-keyframes-at-cuts (frame-accurate langsung dari yt-dlp).
  // Attempt 2: section polos (range-only) + ffmpeg offset-trim kalau timeline asli dipertahankan.
  async function downloadSegmentWithTrim(
    url: string,
    outputDir: string,
    opts: { resolution?: string; startSeconds: number; endSeconds: number },
    onTrim?: () => void,
  ) {
    try {
      const d = await deps.downloader.download(url, outputDir, opts, true);
      return d.filePath;
    } catch {
      const d = await deps.downloader.download(url, outputDir, opts, false);
      const keyframePts = await deps.trimmer.probeFirstKeyframe(d.filePath);
      // Keyframe pertama > 1s → timeline asli dipertahankan, segmen belum akurat → trim ulang.
      if (keyframePts !== null && keyframePts > 1) {
        onTrim?.();
        const trimmedPath = path.join(
          outputDir,
          `${path.basename(d.filePath, path.extname(d.filePath))}_trimmed.mp4`,
        );
        await deps.trimmer.trim(d.filePath, trimmedPath, opts.startSeconds, opts.endSeconds);
        return trimmedPath;
      }
      return d.filePath;
    }
  }

  /** Proses satu job dari queue (entry point tiap item). */
  async function processJob(data: { jobId: string; projectId: string; userId: string }) {
    // Guard awal: job sudah di-cancel → lewati tanpa diproses (tetap dihapus dari queue oleh BullMQ).
    const job = await deps.store.findById(data.jobId);
    if (!job || job.status === 'cancelled') {
      return;
    }

    const { project } = job;
    const jobDir = path.join(TMP_DIR, job.id);
    let filePath: string | null = null;

    try {
      await deps.store.update(job.id, { status: 'processing', startedAt: new Date() });
      emitProgress(job, 10, 'downloading');

      // 1. Metadata video (platform, judul, durasi, thumbnail, resolusi).
      const metadata = await deps.downloader.fetchMetadata(job.sourceUrl);
      await deps.store.update(job.id, {
        platform: metadata.platform,
        videoTitle: metadata.title,
        videoDurationSeconds: metadata.durationSeconds,
        thumbnailUrl: metadata.thumbnailUrl,
        progressPercent: 10,
      });

      // 2. Download — full video atau segmen range (mode timestamp).
      const isTimestamp =
        job.mode === 'timestamp' && job.trimStartSeconds !== null && job.trimEndSeconds !== null;

      if (!isTimestamp) {
        const downloaded = await deps.downloader.download(job.sourceUrl, jobDir, {
          resolution: job.resolution ?? undefined,
        });
        filePath = downloaded.filePath;
      } else {
        // Clamp end ke durasi video + tolak kalau start melewati durasi.
        let start = job.trimStartSeconds!;
        let end = job.trimEndSeconds!;
        if (metadata.durationSeconds !== null && metadata.durationSeconds !== undefined) {
          if (start >= metadata.durationSeconds) {
            throw new Error('trim_start_seconds melebihi durasi video');
          }
          end = Math.min(end, metadata.durationSeconds);
        }
        filePath = await downloadSegmentWithTrim(
          job.sourceUrl,
          jobDir,
          {
            resolution: job.resolution ?? undefined,
            startSeconds: start,
            endSeconds: end,
          },
          () => emitProgress(job, 55, 'trimming'),
        );
      }
      await deps.store.update(job.id, { progressPercent: 40 });
      emitProgress(job, 40, 'downloading');

      // 3. Upload ke folder Drive project (refresh token otomatis kalau kedaluwarsa).
      const account = await deps.store.findDriveAccountByIdAndUser(project.driveAccountId, project.userId);
      if (!account) {
        throw new Error('Drive account untuk project tidak ditemukan');
      }
      await deps.store.update(job.id, { progressPercent: 70 });
      emitProgress(job, 70, 'uploading');
      const uploaded = await deps.uploader.upload(account, project.driveFolderId, filePath);

      // Guard cancel kedua: job bisa di-cancel saat upload berlangsung → jangan timpa status.
      if (await isCancelled(job.id)) {
        return;
      }
      // 4. Selesai.
      await deps.store.update(job.id, {
        status: 'done',
        progressPercent: 100,
        fileName: path.basename(filePath),
        driveFileId: uploaded.id,
        driveFileUrl: uploaded.url,
        finishedAt: new Date(),
      });
      deps.emitter.done(project.userId, {
        jobId: job.id,
        projectId: job.projectId,
        driveFileUrl: uploaded.url,
        fileName: path.basename(filePath),
      });
      await deps.store.incrementFootageCount(project.id);
    } catch (err) {
      // Gagal: tulis status failed + pesan error (kecuali job sudah di-cancel).
      const message = err instanceof Error ? err.message : 'Proses gagal';
      if (await isCancelled(job.id)) {
        return;
      }
      await deps.store.update(job.id, {
        status: 'failed',
        errorMessage: message,
        finishedAt: new Date(),
      });
      deps.emitter.failed(project.userId, {
        jobId: job.id,
        projectId: job.projectId,
        errorMessage: message,
      });
    } finally {
      // Bersihkan file download sementara (selalu, sukses/gagal/cancel).
      if (filePath) {
        await rm(filePath, { force: true });
      }
      await rm(jobDir, { recursive: true, force: true });
    }

    await deps.sentinel.notifyJobFinished(job.batchId, job.projectId, project.userId);
  }

  return { processJob };
}
