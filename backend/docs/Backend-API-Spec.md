# API Specification: Backend (Local Development)

Base URL (local): `http://localhost:4000`
Auth: Bearer token (JWT) di header `Authorization: Bearer <token>` untuk semua endpoint kecuali proses auth.

> Struktur endpoint & event WebSocket sama dengan rancangan sebelumnya, disesuaikan untuk pengujian local (mis. via Postman/Insomnia) dan belum ada dependensi ke frontend.

---

## 1. Auth

### `GET /auth/google`
Redirect ke halaman consent Google OAuth (login).

### `GET /auth/google/callback`
Callback dari Google. Membuat/update user di DB, generate JWT.
**Response:**
```json
{ "token": "jwt...", "user": { "id": "uuid", "name": "...", "email": "...", "avatar_url": "..." } }
```

### `POST /auth/logout`
**Response:** `204 No Content`

---

## 2. Drive Accounts

### `GET /drive-accounts`
List akun Drive milik user.

### `GET /drive-accounts/connect`
Redirect OAuth consent scope Google Drive (tambah akun baru).

### `GET /drive-accounts/connect/callback`
Simpan token baru (terenkripsi) ke `drive_accounts`.

### `PATCH /drive-accounts/:id/set-default`
Set akun Drive sebagai default.

### `DELETE /drive-accounts/:id`
Putuskan koneksi akun Drive.
**Error:** `409` jika masih dipakai project aktif.

---

## 3. Projects

### `GET /projects`
List project milik user. Query: `?page=1&limit=20`

### `POST /projects`
**Body:** `{ "name": "Project A", "drive_account_id": "uuid" }`
**Response:** `201` — otomatis create folder di Drive.

### `GET /projects/:id`
Detail project + ringkasan status job.

### `PATCH /projects/:id`
**Body:** `{ "name": "Nama Baru" }`

### `DELETE /projects/:id`
Soft delete project (folder & file di Drive tidak ikut terhapus).

---

## 4. Link Validation

### `POST /links/validate`
**Body:** `{ "urls": ["https://..."] }`
**Response:** array metadata per link (judul, durasi, thumbnail, platform, resolusi tersedia, atau error jika invalid).

> Untuk testing local tahap awal: cukup uji dengan 1 URL YouTube dulu sebelum platform lain.

---

## 5. Download Jobs

### `POST /projects/:id/jobs`
Submit batch link untuk didownload. Body berisi array link + mode + resolusi per link. Response berisi `batch_id` + list job (`status: pending`).

### `GET /projects/:id/jobs`
List job dalam satu project. Query: `?status=&page=&limit=`

### `GET /jobs/:id`
Detail satu job (untuk polling manual saat testing tanpa WebSocket client).

### `POST /jobs/:id/retry`
Retry job `failed` → `pending`.

### `POST /jobs/:id/cancel`
Cancel job `pending`/`processing`.

---

## 6. Dashboard

### `GET /dashboard/summary`
### `GET /dashboard/active-jobs`
### `GET /dashboard/history`
Query: `?project_id=&status=&platform=&from=&to=&page=&limit=`

---

## 7. Notifications

### `GET /notifications`
Query: `?unread_only=true`

### `PATCH /notifications/:id/read`
### `PATCH /notifications/read-all`

---

## 8. WebSocket (Local Testing)

**Koneksi (local):** `ws://localhost:4000` dengan auth payload `{ token: "jwt..." }`

**Cara testing tanpa frontend:**
Buat script Node.js terpisah pakai `socket.io-client` untuk connect ke server local, subscribe event, dan console.log tiap event masuk — supaya bisa memastikan worker benar-benar emit progress dengan benar sebelum frontend dibuat.

```js
// test-socket-client.js (contoh, dijalankan terpisah saat testing)
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: "PASTE_JWT_DISINI" }
});

socket.on("job:progress", (data) => console.log("progress:", data));
socket.on("job:done", (data) => console.log("done:", data));
socket.on("job:failed", (data) => console.log("failed:", data));
socket.on("batch:completed", (data) => console.log("batch completed:", data));
```

### Event: `job:progress`
```json
{ "job_id": "uuid", "project_id": "uuid", "status": "processing", "progress_percent": 60, "stage": "uploading" }
```

### Event: `job:done`
```json
{ "job_id": "uuid", "project_id": "uuid", "status": "done", "drive_file_url": "...", "file_name": "..." }
```

### Event: `job:failed`
```json
{ "job_id": "uuid", "project_id": "uuid", "status": "failed", "error_message": "..." }
```

### Event: `batch:completed`
```json
{ "batch_id": "uuid", "project_id": "uuid", "total": 5, "done": 4, "failed": 1 }
```

---

## 9. Error Response Format

```json
{ "error": { "code": "INVALID_LINK", "message": "Link tidak valid atau platform tidak didukung" } }
```

**HTTP status:** `400` `401` `403` `404` `409` `422` `500`

---

## 10. Urutan Testing yang Disarankan (Local)

1. Test `GET /auth/google` → `callback` manual di browser, pastikan dapat JWT
2. Pakai JWT itu di Postman untuk test endpoint lain (set sebagai Bearer token)
3. Test `GET /drive-accounts/connect` → callback, pastikan token Drive tersimpan
4. Test `POST /projects` → cek folder benar-benar muncul di Google Drive
5. Test `POST /links/validate` dengan 1 link YouTube
6. Test `POST /projects/:id/jobs` dengan 1 link, mode full → pantau lewat `GET /jobs/:id` sampai `status: done` → cek file muncul di Drive
7. Baru setelah alur single-job berhasil, lanjut test batch (banyak link) + WebSocket client
