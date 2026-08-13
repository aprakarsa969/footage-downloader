# AGENTS.md — Backend (Video Footage Downloader)

Dokumen di `docs/` adalah source of truth untuk spesifikasi. Status implementasi terkini: lihat `docs/CURRENT-STATE.md`. Jika konflik antara spec dan kode, ikuti docs + kode yang terverifikasi.

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
│   │   ├── dashboard.service.ts
│   │   └── notifications.service.ts
│   ├── repositories/        # akses data ke database (bungkus Prisma query)
│   │   ├── user.repository.ts
│   │   ├── driveAccount.repository.ts
│   │   ├── project.repository.ts
│   │   ├── downloadJob.repository.ts
│   │   └── notification.repository.ts
│   ├── workers/             # worker BullMQ: proses download/trim/upload
│   │   └── downloadJob.worker.ts
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
│   ├── utils/                  # helper umum (format tanggal, generate nama file, dll)
│   ├── app.ts                  # setup express app, middleware, routes
│   └── server.ts                # entry point, start server + worker
├── prisma/
│   └── schema.prisma
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

