# Current State — Backend Video Footage Downloader

Status: semua fitur inti terimplementasi & terverifikasi E2E (13 Agustus 2026).

## Fitur yang sudah jadi

| Fitur | Status | Catatan |
|-------|--------|---------|
| Auth (Google OAuth + JWT) | ✅ | JWT 7 hari, user baru dibuat otomatis |
| Drive Accounts | ✅ | connect, list, set default, hapus (409 kalau dipakai project aktif) |
| Projects | ✅ | CRUD, folder Drive dibuat otomatis saat create |
| Links (validasi URL) | ✅ | via yt-dlp `--dump-json` tanpa download |
| Jobs (batch download) | ✅ | pending→processing→done/failed; retry; cancel; maks 50 link/batch |
| Dashboard | ✅ | summary, active-jobs, history + filter (project/status/platform/date) |
| Notifications | ✅ | auto-insert saat batch selesai, list + mark read |
| Socket.IO realtime | ✅ | job progress, done, failed, batch:completed |
| Worker BullMQ | ✅ | download, trim (ffmpeg), upload ke Drive; concurrency 2 |
| Komentar kode | ✅ | Bahasa Indonesia, JSDoc per fungsi, header per file |

## Stack aktual

| Komponen | Rencana (docs/) | Aktual (terverifikasi) |
|----------|-----------------|------------------------|
| Runtime | Node.js LTS | Node.js 24 |
| Bahasa | TypeScript | TypeScript 7, ESM (`"type": "module"`, import pakai `.js`) |
| HTTP | Express | Express 5.2.1 (error async otomatis ke `errorHandler`) |
| ORM | Prisma | Prisma 6.19.3 |
| Queue | BullMQ + Redis | BullMQ 6 + ioredis 6 |
| Realtime | Socket.IO | Socket.IO 4.8.3 |
| Download | yt-dlp + ffmpeg | Binary eksternal, dipanggil via child process (bukan npm) |
| Auth | Google OAuth + JWT | google-auth-library + jsonwebtoken; JWT 7 hari `{sub: user.id}` |
| Port | — | postgres `5433`, redis `6380`, app `4000` |

## Endpoint API

### Auth (mount `/auth`, tanpa auth middleware di callback)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | /auth/google | Redirect consent Google |
| GET | /auth/google/callback | Callback OAuth (buat user + JWT) |
| POST | /auth/logout | 204 (stateless, client hapus token) |

### Drive Accounts (mount `/drive-accounts`, auth kecuali callback)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | / | List akun Drive milik user |
| GET | /connect | Redirect consent Google Drive |
| GET | /connect/callback | Callback OAuth Drive (userId via query state) |
| PATCH | /:id/set-default | Set akun default |
| DELETE | /:id | Putus koneksi (409 kalau masih dipakai project) |

### Projects (mount `/projects`, auth)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | / | List (page/limit) |
| POST | / | Buat (name + drive_account_id; folder Drive otomatis) |
| GET | /:id | Detail + ringkasan status job |
| PATCH | /:id | Rename (name wajib) |
| DELETE | /:id | Soft delete |

### Links (mount `/links`, auth)

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | /validate | Validasi array URL via yt-dlp (maks 20 URL) |

### Jobs (mount **root**, path penuh, auth)

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | /projects/:projectId/jobs | Submit batch download (maks 50 link) |
| GET | /projects/:projectId/jobs | List job per project (filter status, page, limit) |
| GET | /jobs/:id | Detail satu job |
| POST | /jobs/:id/retry | Retry failed → pending (409 kalau bukan failed) |
| POST | /jobs/:id/cancel | Cancel pending/processing (409 kalau sudah final) |

### Dashboard (mount **root**, path penuh, auth)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | /dashboard/summary | Ringkasan: total projects/footage, jobs per status, storage |
| GET | /dashboard/active-jobs | Job pending/processing + project_name |
| GET | /dashboard/history | Riwayat + filter (project_id, status, platform, from, to, page, limit) |

### Notifications (mount **root**, path penuh, auth)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | /notifications | List (?unread_only=true) |
| PATCH | /notifications/:id/read | Tandai satu notifikasi baca |
| PATCH | /notifications/read-all | Tandai semua notifikasi baca |

**Catatan mount**: `routes/index.ts` membedakan dua pola:
- **Prefix**: auth, drive-accounts, links, projects → path belum penuh → `router.use('/auth', authRouter)`.
- **Full path**: dashboard, jobs, notifications → path sudah penuh → `router.use(dashboardRouter)` (mount langsung di root).

## Socket.IO Events

Room: `user:{userId}`. Emit via `emitToUser()` (lihat `websocket/socket.ts`).

| Event | Field | Kapan di-emit |
|-------|-------|---------------|
| `job:progress` | `job_id`, `project_id`, `status='processing'`, `progress_percent` (10/40/55/70), `stage` (downloading/trimming/uploading) | Saat download/trim/upload berlangsung |
| `job:done` | `job_id`, `project_id`, `status='done'`, `drive_file_url`, `file_name` | Upload berhasil |
| `job:failed` | `job_id`, `project_id`, `status='failed'`, `error_message` | Gagal di mana saja |
| `batch:completed` | `batch_id`, `project_id`, `total`, `done`, `failed` | Semua job dalam batch selesai |

## Alur Worker (downloadJob.worker.ts)

Pipeline per job:
```
pending → processing → fetchMetadata → download full/segmen → (trim ffmpeg) → upload Drive → done
                                              ↓ gagal
                                          failed (+ errorMessage)
                                              ↓ batch selesai
                                     notifikasi + emit batch:completed
```

**Guard cancel**: dua titik check:
1. Saat ambil dari queue: `if (job.status === 'cancelled') return` (skip, tak diproses).
2. Sebelum update final (done/failed): cek ulang `isCancelled(job.id)` — bisa di-cancel saat download/upload berlangsung.

**Mode timestamp**: unduh segmen `--download-sections "*start-end"` + `--force-keyframes-at-cuts`.
Kalau `probeFirstKeyframe` → keyframe pertama > 1 detik (timeline asli dipertahankan), fallback ke `trimVideo` (ffmpeg) untuk akurasi frame.

Concurrency: 2 job paralel per worker instance.

## Key Gotchas

1. **BullMQ enqueue tanpa custom jobId** (auto-unique). Kalau pakai custom id = job id yang sudah completed → BullMQ men-dedupe → retry tak pernah di-proses. Bug ini sudah difix.
2. **Cancel = status DB + worker guard**, bukan hapus dari queue. Pending jobs tetap dikonsumsi worker tapi di-skip saat pickup.
3. **Dashboard/jobs/notifications mount di root**: `dashboard.routes.ts` pakai path penuh (`/dashboard/...`) → mount `router.use(dashboardRouter)`, bukan `router.use('/dashboard', ...)`.
4. **Server lifecycle**: background `npx tsx src/server.ts &` mati saat bash timeout → pakai `setsid nohup npx tsx src/server.ts > log 2>&1 < /dev/null &` di call terpisah. Kill via `ps aux | rg "[s]erver.ts"` (hindari `pkill` self-match).
5. **JWT test script**: wajib `process.env.JWT_SECRET ?? 'dev-secret'` (dotenv ter-load via import chain Prisma). Hardcode `'dev-secret'` tanpa load env → UNAUTHORIZED.
6. **Dummy Drive**: `encrypt('dummy-refresh-token-for-test')` + `tokenExpiresAt: new Date(0)` → `invalid_grant` saat upload → job failed. Status `70/uploading` tak pernah muncul (upload tak bisa jalan tanpa OAuth browser). Ini benar untuk testing.
7. **MAX_BATCH_LINKS = 50** per batch download.
8. **Cleanup test**: hapus data via Prisma dalam urutan: jobs → notifications → projects → driveAccounts → user (by userId).

## Test & Verifikasi

Semua test di folder `tests/`: `tests/unit/` (unit, tanpa infra) dan `tests/e2e/` (butuh server + DB + Redis hidup).

### Unit test (`npm run test:unit`, runner bawaan node:test via tsx)

| File | Target | Fungsi |
|------|--------|--------|
| `tests/unit/pipeline.test.ts` | `downloadPipeline.ts` | Stub adapter — guard cancel, full mode, download gagal, trim fallback, batch completed, akun Drive hilang, cleanup file |
| `tests/unit/responses.test.ts` | `responses.ts` | Mapping field, BigInt→string, null passthrough |
| `tests/unit/encryption.test.ts` | `encryption.ts` | Round-trip, iv acak, payload rusak → throw |
| `tests/unit/middlewares.test.ts` | auth + errorHandler | Token valid/invalid/missing, AppError → shape JSON |

### E2E test (butuh server hidup)

| File | Fungsi |
|------|--------|
| `tests/e2e/socket.ts` | Verifikasi Socket.IO (retry loop max 4 attempt) — room isolation, stages, batch:completed |
| `tests/e2e/retry-cancel.ts` | E2E retry (200→pending→re-proses→failed; 409); cancel (200→cancelled; 409) |
| `tests/e2e/dashboard.ts` | E2E summary, active-jobs, history + semua filter + error 400/404/401 |

Verifikasi tipe: `npx tsc --noEmit` (harus clean, zero error). Test di `tests/` tak ikut typecheck — hanya src.

Jalankan unit test:
```bash
npm run test:unit
```

Jalankan E2E:
```bash
# start server di background (tahan bash timeout)
setsid nohup npx tsx src/server.ts > /tmp/opencode/dev.log 2>&1 < /dev/null &
sleep 12
# jalankan test
npm run test:api    # atau test:socket / test:retry
# matikan server
ps aux | rg "[s]erver.ts" | awk '{print $2}' | xargs -r kill -9
```
