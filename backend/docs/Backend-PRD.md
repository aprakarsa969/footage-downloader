# PRD: Backend — Video Footage Downloader (Local Development)

## 1. Tujuan
Membangun backend API + worker untuk aplikasi Video Footage Downloader, dikembangkan dan dijalankan sepenuhnya di **local environment** terlebih dahulu (belum deploy), sebelum nanti diintegrasikan dengan frontend dan di-deploy.

## 2. Scope Backend
Backend bertanggung jawab atas:
1. Autentikasi user via Google OAuth (login) + otorisasi Google Drive
2. Manajemen akun Google Drive yang terhubung per user
3. Manajemen project (termasuk auto-create folder di Drive)
4. Validasi link video & ekstraksi metadata (judul, durasi, thumbnail, resolusi tersedia)
5. Proses download video (via yt-dlp), trim by timestamp (via ffmpeg), dan upload otomatis ke Google Drive
6. Job queue untuk memproses banyak link sekaligus (batch), dengan status tracking
7. Realtime progress update via WebSocket
8. Notifikasi saat batch download selesai
9. Endpoint dashboard (ringkasan, job aktif, riwayat)

**Di luar scope dokumen ini:** frontend, deployment ke cloud (Railway/Render), CI/CD.

## 3. Alur Kerja Utama (Backend Perspective)

```
1. User login → backend generate JWT session, simpan/update data user
2. User connect akun Drive → backend simpan token (terenkripsi) ke drive_accounts
3. User buat project → backend create folder via Drive API, simpan project
4. User submit link(s) untuk divalidasi → backend jalankan yt-dlp (mode info only) → return metadata
5. User submit batch download → backend buat batch_id, insert download_jobs (status: pending), push job ke queue
6. Worker ambil job dari queue:
   a. Update status → processing, emit event WebSocket
   b. Jalankan yt-dlp untuk download (full atau by range jika platform support, else download full)
   c. Jika mode timestamp: jalankan ffmpeg untuk trim
   d. Upload file ke folder Drive project (via Drive API)
   e. Hapus file sementara dari local storage backend
   f. Update status → done (atau failed jika ada error), emit event WebSocket
7. Setelah semua job dalam 1 batch selesai → insert notification, emit event batch:completed
```

## 4. Modul & Tanggung Jawab

| Modul | Tanggung Jawab |
|---|---|
| `auth` | Login Google, callback OAuth, JWT session, logout |
| `drive-accounts` | Connect/disconnect akun Drive, set default, ambil info storage |
| `projects` | CRUD project, auto-create folder Drive |
| `links` | Validasi URL, deteksi platform, ambil metadata via yt-dlp (info mode) |
| `jobs` | Submit batch job, list/detail job, retry, cancel |
| `queue/worker` | Proses job: download → trim (jika perlu) → upload → cleanup |
| `websocket` | Emit event progress/done/failed/batch-completed ke client yang subscribe |
| `notifications` | Simpan & ambil notifikasi user |
| `dashboard` | Endpoint agregasi data (summary, active jobs, history) |

## 5. Keputusan Teknis Penting

- **Bahasa/framework:** TypeScript + Express (lihat `Backend-TechStack.md`)
- **Database:** PostgreSQL via Docker local, dengan Prisma ORM
- **Queue:** BullMQ + Redis (Docker local)
- **Realtime:** Socket.IO
- **Video processing:** yt-dlp + ffmpeg dipanggil sebagai child process dari Node.js
- **Storage sementara:** disimpan di folder lokal backend, dihapus otomatis setelah upload ke Drive sukses
- **Enkripsi token Drive:** wajib dienkripsi sebelum disimpan ke database (AES-256 di level aplikasi)

## 6. Batasan & Hal yang Perlu Diperhatikan (khusus local dev)
- yt-dlp & ffmpeg harus ter-install di komputer local (bukan dependency npm biasa, tapi binary terpisah)
- Google OAuth callback URL diarahkan ke `localhost` selama development
- Redis & PostgreSQL dijalankan via Docker Compose supaya tidak perlu install manual di OS
- Belum ada limit ketat resource di local (beda dengan nanti di free tier cloud), tapi tetap disarankan simulasikan limit (mis. max 2 job paralel) supaya kode sudah siap saat pindah ke cloud

## 7. Kriteria Sukses Fase Backend (Local)
- Semua endpoint di `Backend-API-Spec.md` bisa diuji lewat Postman/Insomnia dan berjalan sesuai spesifikasi
- Alur end-to-end bisa dijalankan penuh secara manual: login → connect Drive → buat project → submit link → file benar-benar muncul di folder Drive yang tepat
- Progress job bisa dipantau realtime lewat WebSocket client sederhana (mis. test dengan `socket.io-client` di script terpisah, sebelum ada frontend)
