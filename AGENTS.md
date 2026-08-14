# AGENTS.md — Video Footage Downloader

Monorepo tanpa workspace npm — dua app independen, tiap subfolder punya `package.json` sendiri. **Tidak ada package.json di root: semua `npm`/`npx` dijalankan dari `backend/` atau `frontend/`.** Perintah git dijalankan dari root.

## Struktur

- `backend/` — Express + TS + Prisma + BullMQ + Socket.IO. **Baca `backend/AGENTS.md` dulu** (Bahasa Indonesia): arsitektur layered, aturan komentar, stack, test. Spesifikasi & status ada di `backend/docs/` (gitignored tapi source of truth).
- `frontend/` — Next.js 16 (App Router, Tailwind v4, **tanpa `src/`**), scaffold baru, **belum ter-commit**. Lib: react-query, zustand, react-hook-form+zod, socket.io-client, framer-motion, cva.

## Gotchas

- **Next.js 16 = breaking changes vs training data.** Baca guide di `node_modules/next/dist/docs/` sebelum nulis kode. Block `<!-- BEGIN:nextjs-agent-rules -->` di `frontend/AGENTS.md` ditulis ulang otomatis oleh `next dev` — jangan dihapus dari diff.
- Tailwind v4 via `@tailwindcss/postcss` — konfigurasi pakai CSS `@theme`, bukan `tailwind.config.js`.
- Prettier + `prettier-plugin-tailwindcss` terpasang tapi **belum ada config** — setup `.prettierrc` bila perlu.
- Backend butuh `.env` (gitignored) — salin dari `backend/.env.example` sebelum dev/test.
- Infra pakai port non-default (docker-compose): Postgres **5433**, Redis **6380**. E2E test butuh infra + server hidup.
- CORS allowlist satu-satunya di `backend/src/config/cors.ts`, dibaca dari env `CORS_ORIGINS` (comma-separated). **Default `http://localhost:5173` (Vite)** — frontend Next jalan di port 3000, tambahkan `http://localhost:3000` di env untuk dev bersama.

## Git

- Remote SSH: `git@github.com:aprakarsa969/footage-downloader.git`. Branch aktif: `feat/cors-allowlist`.
- Commit hanya saat diminta user.

## Verify

- Backend: `cd backend && npm run test:unit` (tanpa infra), `npx tsc --noEmit` (hanya `src/`).
- Frontend: `cd frontend && npm run lint`; typecheck via `npx tsc --noEmit`.
