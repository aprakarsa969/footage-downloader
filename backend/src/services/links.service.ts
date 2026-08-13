// Service Links: validasi URL sebelum dijadikan job download.
// Setiap URL di-fetch metadatanya oleh yt-dlp; yang gagal dibungkus error INVALID_LINK (tidak melempar exception).
import { fetchVideoMetadata, YtDlpError, type VideoMetadata } from '../lib/ytdlp.js';

const MAX_URLS = 20;

export type ValidateLinkResult =
  | ({ url: string } & VideoMetadata)
  | { url: string; error: { code: string; message: string } };

/** Validasi satu URL: return metadata atau error INVALID_LINK. */
async function validateOne(url: string): Promise<ValidateLinkResult> {
  try {
    const meta = await fetchVideoMetadata(url);
    return { url, ...meta };
  } catch (err) {
    const message = err instanceof YtDlpError ? err.message : 'Link tidak valid atau platform tidak didukung';
    return { url, error: { code: 'INVALID_LINK', message } };
  }
}

/** Validasi banyak URL sekaligus (maks 20), berurutan paralel. */
export async function validateUrls(urls: string[]): Promise<ValidateLinkResult[]> {
  return Promise.all(urls.slice(0, MAX_URLS).map(validateOne));
}
