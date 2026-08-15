// Wrapper yt-dlp (binary eksternal, bukan dependency npm).
// Dua operasi: fetchVideoMetadata (info video) dan downloadVideo (unduh full atau segmen range).
// Penting: timeout metadata (60s) dan download (30 menit) dipisah — download video besar butuh waktu lama.
// Cookie TikTok: set TIKTOK_COOKIES_BROWSER (chromium/firefox) atau TIKTOK_COOKIES_FILE
// agar video sensitif/age-gated bisa diunduh. Lihat .env.example.
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 32 * 1024 * 1024;
const METADATA_TIMEOUT_MS = 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 30 * 60 * 1000;

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Jalankan yt-dlp dan return stdout. Error dilempar mentah (classifyError di pemanggil). */
async function execYtdlp(args: string[], timeout: number): Promise<string> {
  const result = await execFileAsync('yt-dlp', args, { maxBuffer: MAX_BUFFER, timeout });
  return result.stdout;
}

/**
 * Bangun argumen cookies untuk yt-dlp — hanya untuk URL TikTok/Douyin.
 * Prioritas: TIKTOK_COOKIES_BROWSER > TIKTOK_COOKIES_FILE.
 * Cookie TikTok tidak boleh dikirim ke platform lain (YouTube, dst.) karena mengganggu format selection.
 */
function getCookieArgs(url: string): string[] {
  if (!/tiktok\.com|douyin\.com/i.test(url)) return [];

  const browser = process.env.TIKTOK_COOKIES_BROWSER;
  if (browser) return ['--cookies-from-browser', browser];

  const file = process.env.TIKTOK_COOKIES_FILE;
  if (!file) return [];
  if (!existsSync(file)) {
    console.warn(`[ytdlp] TIKTOK_COOKIES_FILE="${file}" tidak ditemukan — yt-dlp berjalan tanpa cookies`);
    return [];
  }
  return ['--cookies', file];
}

/**
 * Argumen ekstra untuk TikTok/Douyin: User-Agent & Referer modern
 * agar request tidak diblokir anti-bot Cloudflare/Akamai TikTok.
 */
function getTikTokExtraArgs(url: string): string[] {
  if (!/tiktok\.com|douyin\.com/i.test(url)) return [];
  return [
    '--user-agent', DESKTOP_USER_AGENT,
    '--referer', 'https://www.tiktok.com/',
  ];
}

export type VideoMetadata = {
  title: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  platform: string;
  availableResolutions: number[];
};

/** Error khas yt-dlp, dipakai service/worker untuk ambil pesan yang sudah diterjemahkan. */
export class YtDlpError extends Error {
  message: string;
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

type YtDlpInfo = {
  title?: string;
  duration?: number | null;
  thumbnail?: string | null;
  extractor_key?: string;
  formats?: Array<{ height?: number | null; vcodec?: string | null }>;
};

/**
 * Ambil metadata video (judul, durasi, thumbnail, platform, resolusi tersedia).
 * `--dump-json` sekali jalan; resolusi dihitung dari formats yang punya video (vcodec non-none).
 */
export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  let stdout: string;
  try {
    stdout = await execYtdlp(
      ['--dump-json', '--no-playlist', '--no-warnings', '--extractor-retries', '3', ...getCookieArgs(url), ...getTikTokExtraArgs(url), url],
      METADATA_TIMEOUT_MS,
    );
  } catch (err) {
    throw new YtDlpError(classifyError(err));
  }

  let info: YtDlpInfo;
  try {
    info = JSON.parse(stdout);
  } catch {
    throw new YtDlpError('Link tidak valid atau platform tidak didukung');
  }

  const resolutions = Array.from(
    new Set(
      (info.formats ?? [])
        .filter((f) => typeof f.height === 'number' && f.vcodec && f.vcodec !== 'none')
        .map((f) => f.height as number),
    ),
  ).sort((a, b) => b - a);

  return {
    title: info.title ?? '',
    durationSeconds: info.duration ?? null,
    thumbnailUrl: info.thumbnail ?? null,
    platform: (info.extractor_key ?? '').toLowerCase(),
    availableResolutions: resolutions,
  };
}

/** Terjemahkan stderr yt-dlp ke pesan error user-friendly Bahasa Indonesia. */
function classifyError(err: unknown): string {
  const stderr =
    typeof err === 'object' && err !== null && 'stderr' in err && typeof err.stderr === 'string'
      ? err.stderr
      : err instanceof Error
        ? err.message
        : '';
  if (
    /Private video|Video unavailable|Sign in to confirm|no longer available|not available in your country|removed for violating|Video is unavailable/i.test(
      stderr,
    )
  ) {
    return 'Video tidak tersedia atau privat';
  }
  if (/comfortable for some audiences|Log in for access|log in to confirm/i.test(stderr)) {
    return 'Video dikunci TikTok (perlu login) — periksa TIKTOK_COOKIES_FILE';
  }
  if (/Unable to extract universal data for rehydration/i.test(stderr)) {
    return 'Gagal mengambil data dari TikTok, coba lagi';
  }
  if (/download sections feature is not supported|download-sections/i.test(stderr)) {
    return 'Platform tidak mendukung download per segmen (mode timestamp)';
  }
  return 'Link tidak valid atau platform tidak didukung';
}

/**
 * Unduh video. Dua perilaku:
 * - full: format string `bv*[height<=res][ext=mp4]+ba[ext=m4a]/b[...]/...` — video+audio terpisah lalu di-merge ke mp4.
 * - timestamp (startSeconds/endSeconds): `--download-sections "*start-end"` → unduh segmen RANGE saja (bukan video penuh).
 *   useKeyframeCuts=true → `--force-keyframes-at-cuts` (potongan frame-akurat). 
 *   useKeyframeCuts=false → range polos, hasilnya bergantung keyframe; worker lalu probe + trim ffmpeg bila perlu.
 * Output: `%(id)s.%(ext)s`; path final dibaca dari `--print after_move:filepath`.
 */
export async function downloadVideo(
  url: string,
  outputDir: string,
  options: { resolution?: string; startSeconds?: number; endSeconds?: number } = {},
  useKeyframeCuts = true,
): Promise<{ filePath: string }> {
  await mkdir(outputDir, { recursive: true });

  const format = options.resolution && !Number.isNaN(Number(options.resolution))
    ? `bv*[height<=${options.resolution}][ext=mp4]+ba[ext=m4a]/b[height<=${options.resolution}]/bv*[height<=${options.resolution}]+ba/b`
    : 'bv*[ext=mp4]+ba[ext=m4a]/b/bv*+ba/b';

  const args = [
    '-f',
    format,
    '-o',
    `${outputDir}/%(id)s.%(ext)s`,
    '--merge-output-format',
    'mp4',
    '--no-progress',
    '--no-playlist',
    '--extractor-retries',
    '3',
    ...getCookieArgs(url),
    ...getTikTokExtraArgs(url),
  ];

  if (options.startSeconds !== undefined && options.endSeconds !== undefined) {
    args.push('--download-sections', `*${options.startSeconds}-${options.endSeconds}`);
    if (useKeyframeCuts) {
      args.push('--force-keyframes-at-cuts');
    }
  }

  args.push('--print', 'after_move:filepath', url);

  let stdout: string;
  try {
    stdout = await execYtdlp(args, DOWNLOAD_TIMEOUT_MS);
  } catch (err) {
    throw new YtDlpError(classifyError(err));
  }

  const filePath = stdout.trim().split('\n').filter(Boolean).pop();
  if (!filePath) {
    throw new YtDlpError('Download selesai tanpa hasil file');
  }
  return { filePath };
}
