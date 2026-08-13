// Wrapper ffmpeg/ffprobe (binary eksternal, dipanggil via child process — bukan dependency npm).
// Dua fungsi: trimVideo (potong segmen video + re-encode) dan probeFirstKeyframe (cek posisi keyframe pertama).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 32 * 1024 * 1024;
const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Potong video [startSeconds, endSeconds) dan re-encode ke H.264/AAC.
 * Dipakai saat mode timestamp dan hasil download yt-dlp belum dipotong akurat
 * (fallback setelah --download-sections tanpa --force-keyframes-at-cuts).
 * -ss sebelum -i = seek cepat; -t duration = panjang segmen.
 */
export async function trimVideo(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  endSeconds: number,
) {
  const duration = endSeconds - startSeconds;
  if (duration <= 0) {
    throw new Error('Durasi trim tidak valid (end harus lebih besar dari start)');
  }
  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-ss',
        String(startSeconds),
        '-i',
        inputPath,
        '-t',
        String(duration),
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '18',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outputPath,
      ],
      { maxBuffer: MAX_BUFFER, timeout: TIMEOUT_MS },
    );
  } catch (err) {
    throw new Error(
      `ffmpeg trim gagal: ${err instanceof Error && 'stderr' in err ? String((err as { stderr?: unknown }).stderr ?? err.message) : err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

/**
 * Cari timestamp (pts_time) keyframe pertama di stream video.
 * Dipakai untuk deteksi: kalau hasil --download-sections mempertahankan timeline asli
 * (keyframe pertama > 1s), perlu trim ulang via ffmpeg. Kalau timeline di-rebase ke 0 (pts 0),
 * segmen sudah akurat langsung dari yt-dlp. Return null kalau tak bisa dianalisa.
 */
export async function probeFirstKeyframe(filePath: string): Promise<number | null> {
  let stdout: string;
  try {
    const result = await execFileAsync(
      'ffprobe',
      [
        '-select_streams',
        'v',
        '-show_entries',
        'packet=pts_time,flags',
        '-of',
        'json',
        filePath,
      ],
      { maxBuffer: MAX_BUFFER, timeout: TIMEOUT_MS },
    );
    stdout = result.stdout;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(stdout) as { packets?: { pts_time?: string; flags?: string }[] };
    const keyframe = data.packets?.find((p) => p.flags?.includes('K'));
    if (!keyframe?.pts_time) {
      return null;
    }
    return Number(keyframe.pts_time);
  } catch {
    return null;
  }
}
