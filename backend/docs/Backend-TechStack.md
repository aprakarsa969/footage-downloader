# Tech Stack: Backend (Local Development)

## Runtime & Framework
| Komponen | Pilihan | Alasan |
|---|---|---|
| Runtime | Node.js (LTS, mis. v20+) | Ekosistem luas, cocok untuk child process yt-dlp/ffmpeg |
| Framework | Express.js | Simpel, cepat setup, banyak referensi |
| Bahasa | TypeScript | Type-safety, memudahkan AI copilot generate kode konsisten |

## Database
| Komponen | Pilihan | Alasan |
|---|---|---|
| Database | PostgreSQL (jalan via Docker local) | Sesuai schema yang sudah dirancang |
| ORM | Prisma | Migrasi mudah, type-safe query, cocok dikembangkan dengan AI copilot |

## Job Queue & Realtime
| Komponen | Pilihan | Alasan |
|---|---|---|
| Queue | BullMQ | Job queue robust, butuh Redis |
| Redis | Redis (jalan via Docker local) | Dibutuhkan BullMQ |
| Realtime | Socket.IO | Untuk emit progress job ke frontend nanti |

## Video Processing
| Komponen | Pilihan | Alasan |
|---|---|---|
| Ekstraksi video | yt-dlp (binary, dipanggil via child process) | Support banyak platform |
| Trim/proses video | ffmpeg (binary, dipanggil via child process) | Standar industri untuk potong video |

## Auth & Integrasi Google
| Komponen | Pilihan | Alasan |
|---|---|---|
| OAuth | google-auth-library / googleapis (Node) | Library resmi Google untuk OAuth + Drive API |
| Session | JWT (jsonwebtoken) | Simpel untuk auth API |
| Enkripsi token | Node `crypto` (AES-256) | Untuk enkripsi access_token/refresh_token Drive di DB |

## Environment Local
| Komponen | Pilihan | Alasan |
|---|---|---|
| Orkestrasi service local | Docker Compose | Menjalankan PostgreSQL + Redis dengan 1 perintah, tanpa install manual di OS |
| Environment variables | dotenv (`.env`) | Standar untuk config lokal |
| Dev server | `tsx watch` atau `nodemon` | Auto-restart saat kode berubah |

## Testing & Kualitas Kode (opsional tapi disarankan)
| Komponen | Pilihan | Alasan |
|---|---|---|
| Testing | Vitest / Jest | Unit test untuk service penting (validasi link, penamaan file, dll) |
| Linting | ESLint + Prettier | Konsistensi kode, terutama karena akan banyak dibantu AI copilot |

---

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

**Alur request tipikal (contoh: buat project baru):**
```
routes/projects.routes.ts
  → controllers/projects.controller.ts   (terima request, validasi body)
    → services/projects.service.ts        (logic: buat folder Drive, susun data)
      → repositories/project.repository.ts (simpan ke DB via Prisma)
      → lib/googleDrive.ts                 (panggil Drive API)
```

## Kebutuhan Instalasi di Komputer Local
- Node.js LTS
- Docker Desktop (untuk PostgreSQL & Redis via Docker Compose)
- yt-dlp (binary, bisa via `pip install yt-dlp` atau download binary langsung)
- ffmpeg (binary, install via package manager OS atau download langsung)
- Kredensial Google Cloud Console (OAuth Client ID untuk Google Login + Drive API, bisa pakai `http://localhost:PORT/...` sebagai redirect URI saat development)

---

## Catatan Penyesuaian untuk Local Dev
- Tidak perlu Redis cloud (Upstash) dulu — cukup Redis via Docker di local
- Tidak perlu deploy ke Railway/Render dulu — semua dijalankan dengan `npm run dev` + `docker compose up`
- Google OAuth redirect URI diarahkan ke `http://localhost:<port>/auth/google/callback` (nanti diganti saat deploy)
- File sementara hasil download disimpan di folder lokal (mis. `backend/tmp/`), pastikan masuk `.gitignore`
