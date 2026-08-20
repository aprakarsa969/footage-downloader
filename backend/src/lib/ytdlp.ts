// Wrapper yt-dlp (binary eksternal, bukan dependency npm).
// Dua operasi: fetchVideoMetadata (info video) dan downloadVideo (unduh full atau segmen range).
// Penting: timeout metadata (60s) dan download (30 menit) dipisah — download video besar butuh waktu lama.
// Cookie TikTok: set TIKTOK_COOKIES_BROWSER (chromium/firefox) atau TIKTOK_COOKIES_FILE
// agar video sensitif/age-gated bisa diunduh. Lihat .env.example.
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 32 * 1024 * 1024;
const METADATA_TIMEOUT_MS = 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 30 * 60 * 1000;

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

/** Jalankan yt-dlp dan return stdout. Error dilempar mentah (classifyError di pemanggil). */
async function execYtdlp(args: string[], timeout: number): Promise<string> {
  const result = await execFileAsync('yt-dlp', args, { maxBuffer: MAX_BUFFER, timeout });
  return result.stdout;
}

/**
 * msToken TikTok kadaluarsa (hari) & bila basi memicu 403 — yt-dlp malah bisa
 * mengambil msToken segar sendiri bila tak diberi yang basi. ponytail: strip msToken
 * dari cookies file, sisakan login stabil (sessionid, sid_guard, passport, ttwid), lalu
 * teruskan salinan — jadi tiap run = rotasi msToken otomatis. Cache sekali (re-export
 * cookies → restart server).
 */
let filteredCookieCache: string | null | undefined;
function resolveTikTokCookieFile(file: string): string {
  if (filteredCookieCache !== undefined) return filteredCookieCache ?? '';
  filteredCookieCache = null;
  try {
    const lines = readFileSync(file, 'utf8').split('\n');
    const filtered = lines.filter((l) => !/\tmsToken\t/.test(l));
    const dir = path.join(tmpdir(), 'footage-downloader');
    mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'tiktok-cookies.txt');
    writeFileSync(out, filtered.join('\n'), 'utf8');
    filteredCookieCache = out;
  } catch (err) {
    console.warn('[ytdlp] gagal filter cookies TikTok:', err instanceof Error ? err.message : err);
    filteredCookieCache = null;
  }
  return filteredCookieCache ?? '';
}

/**
 * Bangun argumen cookies untuk yt-dlp — hanya untuk URL TikTok/Douyin.
 * Prioritas: TIKTOK_COOKIES_FILE > TIKTOK_COOKIES_BROWSER.
 * File cookies lebih deterministik (tidak butuh browser tertutup / keyring),
 * jadi jadi pilihan utama; browser sebagai fallback.
 * Cookie TikTok tidak boleh dikirim ke platform lain (YouTube, dst.) karena mengganggu format selection.
 */
function getCookieArgs(url: string): string[] {
  if (!/tiktok\.com|douyin\.com/i.test(url)) return [];

  const rawFile = process.env.TIKTOK_COOKIES_FILE;
  if (rawFile) {
    if (!existsSync(rawFile)) {
      console.warn(`[ytdlp] TIKTOK_COOKIES_FILE="${rawFile}" tidak ditemukan — yt-dlp berjalan tanpa cookies`);
    } else {
      return ['--cookies', resolveTikTokCookieFile(rawFile)];
    }
  }

  const browser = process.env.TIKTOK_COOKIES_BROWSER;
  if (browser) return ['--cookies-from-browser', browser];

  return [];
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
  retryable: boolean;
  constructor(message: string, retryable = false) {
    super(message);
    this.message = message;
    this.retryable = retryable;
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
    const c = classifyError(err);
    throw new YtDlpError(c.message, c.retryable);
  }

  let info: YtDlpInfo;
  try {
    info = JSON.parse(stdout);
  } catch {
    throw new YtDlpError('Link tidak valid atau platform tidak didukung', true);
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
function classifyError(err: unknown): { message: string; retryable: boolean } {
  const stderr =
    typeof err === 'object' && err !== null && 'stderr' in err && typeof err.stderr === 'string'
      ? err.stderr
      : err instanceof Error
        ? err.message
        : '';
  console.warn('[ytdlp] error mentah:', stderr.slice(0, 1000));
  if (
    /Private video|Video unavailable|no longer available|not available in your country|removed for violating|Video is unavailable/i.test(
      stderr,
    )
  ) {
    return { message: 'Video tidak tersedia atau privat', retryable: false };
  }
  if (/comfortable for some audiences|Log in for access/i.test(stderr)) {
    return { message: 'Video dikunci TikTok (perlu login) — periksa TIKTOK_COOKIES_FILE', retryable: false };
  }
  if (/Sign in to confirm you'?re not a bot|confirm you'?re not a bot/i.test(stderr)) {
    return { message: 'TikTok minta konfirmasi bot — coba lagi', retryable: true };
  }
  if (/Unable to extract universal data for rehydration/i.test(stderr)) {
    return { message: 'Gagal mengambil data dari TikTok, coba lagi', retryable: true };
  }
  if (/download sections feature is not supported|download-sections/i.test(stderr)) {
    return { message: 'Platform tidak mendukung download per segmen (mode timestamp)', retryable: false };
  }
  if (/ETIMEDOUT|ECONNRESET|unexpected EOF|Connection (re|dis)established|getaddrinfo|ENOTFOUND/i.test(stderr)) {
    return { message: 'Koneksi gagal saat menghubungi TikTok, coba lagi', retryable: true };
  }
  return { message: 'Link tidak valid atau platform tidak didukung', retryable: true };
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
    const c = classifyError(err);
    throw new YtDlpError(c.message, c.retryable);
  }

  const filePath = stdout.trim().split('\n').filter(Boolean).pop();
  if (!filePath) {
    throw new YtDlpError('Download selesai tanpa hasil file');
  }
  return { filePath };
}
