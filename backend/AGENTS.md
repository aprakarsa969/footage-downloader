# AGENTS.md — Backend (Video Footage Downloader)

Dokumen di `docs/` adalah source of truth untuk spesifikasi. Status implementasi terkini: lihat `docs/CURRENT-STATE.md`. Jika konflik antara spec dan kode, ikuti docs + kode yang terverifikasi.

## Git & Monorepo

Repo root ada di `footage-downloader/` (satu level di atas folder ini) — backend hidup di subfolder `backend/`. Frontend nanti jadi sibling folder (`frontend/`) di root yang sama.

- Branch `main`; remote `origin` → `git@github.com:aprakarsa969/footage-downloader.git` (SSH — HTTPS butuh credential terpisah).
- `docs/`, `postman/`, `.agents/`, `.postman/`, `skills-lock.json` di-gitignore → **tidak ikut commit** (lokal saja). `docs/CURRENT-STATE.md` tidak ter-versioning tapi tetap source of truth.
- Perintah git dijalankan dari root repo (`cd ..` dari sini) — struktur file relatif tetap `backend/...`.
- Commit hanya saat diminta user.

## Stack (rencana, per docs/Backend-TechStack.md)
- Node.js LTS + TypeScript + Express
- PostgreSQL (Docker) + Prisma ORM
- BullMQ + Redis (Docker) untuk job queue
- Socket.IO untuk realtime
- yt-dlp + ffmpeg: binary eksternal dipanggil via child process — BUKAN dependency npm
- Google OAuth + Drive API; session pakai JWT


## Struktur Folder (Layered Architecture)

Pemisahan berdasarkan layer (bukan per-fitur/module), supaya tanggung jawab tiap bagian jelas: request masuk → controller → service (business logic) → repository (akses data).

```
backend/
├── src/
│   ├── config/            # koneksi DB, redis, env config, google oauth client
│   │   ├── prisma.ts
│   │   ├── redis.ts
│   │   └── googleOAuth.ts
│   ├── routes/            # definisi endpoint & mapping ke controller
│   │   ├── auth.routes.ts
│   │   ├── driveAccounts.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── links.routes.ts
│   │   ├── jobs.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── notifications.routes.ts
│   │   └── index.ts        # gabungkan semua route
│   ├── controllers/        # terima request, validasi input, panggil service, bentuk response
│   │   ├── auth.controller.ts
│   │   ├── driveAccounts.controller.ts
│   │   ├── projects.controller.ts
│   │   ├── links.controller.ts
│   │   ├── jobs.controller.ts
│   │   ├── dashboard.controller.ts
│   │   └── notifications.controller.ts
│   ├── services/            # business logic murni, tidak tahu soal HTTP
│   │   ├── auth.service.ts
│   │   ├── driveAccounts.service.ts
│   │   ├── projects.service.ts
│   │   ├── links.service.ts
│   │   ├── jobs.service.ts
│   │   └── dashboard.service.ts
│   ├── repositories/        # akses data ke database (bungkus Prisma query)
│   │   ├── user.repository.ts
│   │   ├── driveAccount.repository.ts
│   │   ├── project.repository.ts
│   │   ├── downloadJob.repository.ts
│   │   └── notification.repository.ts
│   ├── workers/             # BullMQ: queue, worker, dan pipeline download (adapter-injectable)
│   │   ├── downloadJob.queue.ts
│   │   ├── downloadJob.worker.ts
│   │   └── downloadPipeline.ts
│   ├── lib/                 # wrapper eksternal: yt-dlp, ffmpeg, google drive api, encryption
│   │   ├── ytdlp.ts
│   │   ├── ffmpeg.ts
│   │   ├── googleDrive.ts
│   │   └── encryption.ts
│   ├── middlewares/          # auth middleware, error handler, validasi request
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.middleware.ts
│   ├── websocket/            # setup socket.io & fungsi emit event
│   │   └── socket.ts
│   ├── types/                 # shared TypeScript types/interfaces & DTO
│   │   ├── express.d.ts
│   │   └── pipeline.ts        # seam adapter pipeline (dipakai unit test)
│   ├── utils/                  # helper umum
│   │   ├── AppError.ts
│   │   └── responses.ts        # mapper camelCase Prisma → snake_case JSON
│   ├── app.ts                  # setup express app, middleware, routes, Swagger /docs
│   └── server.ts                # entry point, start server + worker
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/                  # test (tidak ikut typecheck — hanya src)
│   ├── e2e/                # butuh server + DB + Redis hidup
│   └── unit/               # node:test via tsx, tanpa infra
├── docker-compose.yml       # postgres + redis
├── .env.example
├── package.json
└── tsconfig.json
```


## Komentar Kode

Semua file di `src/` dikomentari dalam **Bahasa Indonesia**:

- **Header per file**: satu atau dua baris komentar menjelaskan peran file + hal-hal kritis (misal: mount pattern, gotcha BullMQ, alur pipeline worker).
- **JSDoc per fungsi**: `/** ... */` sebelum fungsi/ekspor, menjelaskan parameter wajib, return value, behavior khusus, error yang mungkin dilempar, atau efek samping (emit socket, insert notifikasi).
- **Tanpa komentar baris**: tidak ada `// comment` per baris kode. Komentari *apa* dan *mengapa*, bukan *bagaimana*.
- **Prinsip**: komentar harus menghemat waktu pembaca — jika komentar hanya mengulang nama fungsi, hapus komentarnya.

## Test

- **Unit** (`npm run test:unit`): runner bawaan `node:test` via tsx, file `tests/unit/*.test.ts`, tanpa infra. Pipeline di-test dengan stub adapter (`createDownloadPipeline` injectable).
- **E2E** (`npm run test:api` / `test:socket` / `test:retry`): butuh server + DB + Redis hidup. Start server dulu: `setsid nohup npx tsx src/server.ts > /tmp/opencode/dev.log 2>&1 < /dev/null &`.
- **Typecheck**: `npx tsc --noEmit` — hanya `src/`, file `tests/` tak ikut.

