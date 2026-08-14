# Spesifikasi Data Frontend per Halaman

Dokumen ini merinci data, komponen, dan state yang dibutuhkan tiap halaman, sebagai acuan untuk desain UI/UX.

---

## 1. Login Page

**Komponen:**
- Logo/nama app
- Tombol "Login with Google"
- Teks singkat penjelasan app (opsional)

**Data:** Tidak ada data dinamis (halaman statis sebelum auth)

**State:**
- Default
- Loading (saat redirect ke Google)
- Error (jika login gagal — tampilkan pesan singkat)

---

## 2. Dashboard

### 2.1 Section: Ringkasan (Summary Cards)
**Data per card:**
- Total Project → angka (`total_projects`)
- Total Footage Tersimpan → angka (`total_footage`)
- Job Aktif Saat Ini → angka (`active_jobs_count`)
- Storage Drive → used/total (format: "1.2 GB / 15 GB") + progress bar persentase

### 2.2 Section: Status Download Aktif
**List item, per job:**
- Thumbnail (kecil)
- Judul video (`video_title`, fallback: potongan URL jika judul belum ada)
- Nama project (`project_name`)
- Platform (icon: YouTube/TikTok/IG/dll, dari `platform`)
- Progress bar (`progress_percent`)
- Stage saat ini (label: "Mengunduh"/"Memotong"/"Mengunggah", dari `stage`)
- Tombol cancel (icon)

**State:**
- Empty state: "Tidak ada download yang sedang berjalan"
- Data ini update realtime via WebSocket (`job:progress`)

### 2.3 Section: Riwayat Download (preview, beberapa entri terakhir)
**List item, per entri:**
- Thumbnail
- Judul video
- Nama project
- Status (badge: Berhasil/Gagal/Dibatalkan, dari `status`)
- Tanggal (`created_at`, format relatif: "2 jam lalu")
- Link "Lihat semua" → ke halaman Riwayat Download lengkap

### 2.4 CTA
- Tombol "Buat Project Baru" (menonjol, biasanya di top-right atau floating)

---

## 3. Manajemen Akun Google Drive

### 3.1 List Akun Drive
**Card/row per akun:**
- Avatar/icon Google
- Email akun (`google_account_email`)
- Badge "Default" jika `is_default: true`
- Storage bar: used/total (`storage_used_bytes` / `storage_total_bytes`)
- Status koneksi (`is_active`: Terhubung/Terputus)
- Tanggal terhubung (`connected_at`)
- Tombol aksi: "Jadikan Default" (disabled jika sudah default), "Putuskan Koneksi"

### 3.2 CTA
- Tombol "+ Hubungkan Akun Drive Baru"

**State:**
- Empty state: "Belum ada akun Drive terhubung, hubungkan sekarang untuk mulai membuat project"
- Konfirmasi modal saat klik "Putuskan Koneksi" (terutama jika akun masih dipakai project aktif → tampilkan warning)

---

## 4. List Project

### 4.1 Grid/List Card per Project
**Data per card:**
- Nama project (`name`)
- Jumlah footage (`total_footage_count`) — misal "12 footage"
- Akun Drive terhubung (`drive_account_email`, ditampilkan singkat)
- Tanggal dibuat (`created_at`)
- Icon/link shortcut ke folder Drive (`drive_folder_url`) — buka tab baru
- Klik card → ke Detail Project

### 4.2 CTA
- Tombol "+ Buat Project Baru" → buka form/modal:
  - Input: Nama project (text)
  - Dropdown: Pilih akun Drive tujuan (list dari `GET /drive-accounts`)

**State:**
- Empty state: "Belum ada project, buat project pertamamu"
- Loading skeleton saat fetch list

---

## 5. Detail Project

### 5.1 Header Project
**Data:**
- Nama project (editable inline atau via modal edit)
- Link folder Drive (`drive_folder_url`)
- Ringkasan status: "3 pending • 1 processing • 8 done • 1 failed"

### 5.2 Form Tambah Link (area utama untuk aksi user)
**Per baris/field link:**
- Input URL video
- Tombol "+ Tambah Link Lain" (dynamic field, bisa banyak)
- Tombol hapus per baris (icon X)

**Setelah link di-input (trigger validasi via `POST /links/validate`), tampilkan preview per link:**
- Thumbnail
- Judul video
- Durasi (format mm:ss)
- Badge platform
- Toggle mode: Full / Timestamp
  - Jika Timestamp dipilih → muncul 2 input: waktu mulai & waktu selesai (format mm:ss atau slider)
- Dropdown resolusi (dari `available_resolutions`)
- Jika link invalid → tampilkan pesan error inline (`error`), field ditandai merah

**CTA:**
- Tombol "Download Semua" (submit batch) — disabled jika ada link yang masih invalid/belum divalidasi

### 5.3 List Job dalam Project
**Card/row per job:**
- Thumbnail
- Judul video (`video_title`)
- Platform (badge/icon)
- Mode (Full / Timestamp `00:30–01:30`)
- Resolusi
- Status (badge, dengan warna beda per status: pending=abu, processing=biru, done=hijau, failed=merah, cancelled=abu gelap)
- Progress bar (jika `processing`, update realtime via WebSocket)
- Link ke file di Drive (jika `done`, `drive_file_url`)
- Pesan error singkat (jika `failed`, `error_message`)
- Tombol aksi kontekstual:
  - `failed` → tombol "Retry"
  - `pending`/`processing` → tombol "Cancel"

**Filter/sort di atas list:** by status (tab: Semua/Pending/Processing/Done/Failed)

---

## 6. Riwayat Download (Log Lengkap)

### 6.1 Filter Bar
- Dropdown: Project (all/pilih salah satu)
- Dropdown: Status
- Dropdown: Platform
- Date range picker (`from`, `to`)

### 6.2 Tabel/List Riwayat
**Kolom per baris:**
- Thumbnail
- Judul video
- Nama project (klik → ke Detail Project)
- Platform
- Mode & resolusi
- Status (badge)
- Tanggal (`created_at`)
- Tombol "Retry" (khusus status failed)
- Link ke Drive (khusus status done)

**State:**
- Empty state (tergantung filter aktif): "Tidak ada riwayat yang cocok dengan filter ini"
- Pagination di bawah tabel

---

## 7. Notifikasi

### 7.1 Dropdown/Panel Notifikasi (biasanya dari icon bell di navbar)
**Per item:**
- Pesan (`message`)
- Waktu (`created_at`, format relatif)
- Indikator belum dibaca (dot/bold, dari `is_read: false`)
- Klik item → redirect ke project terkait (`project_id`) + tandai read

**CTA:**
- "Tandai semua sudah dibaca"

**State:**
- Empty state: "Belum ada notifikasi"
- Badge counter di icon bell (jumlah unread)

---

## 8. Pengaturan Akun (Profile/Settings)

**Data:**
- Avatar (`avatar_url`)
- Nama (`name`)
- Email (`email`)
- Toggle: Notifikasi email aktif/nonaktif (`notif_email_enabled`)
- Toggle: Notifikasi in-app aktif/nonaktif (`notif_inapp_enabled`)
- Tombol "Logout"

---

## 9. Komponen Global (dipakai di banyak halaman)

| Komponen | Dipakai di | Data yang dibutuhkan |
|---|---|---|
| Navbar | Semua halaman (setelah login) | Avatar user, nama, icon notifikasi (+ badge counter), link ke Dashboard/Projects/Settings |
| Status Badge | Detail Project, Riwayat, Dashboard | `status` job → warna & label berbeda |
| Progress Bar | Dashboard, Detail Project | `progress_percent`, update via WebSocket |
| Platform Icon | Semua tempat yang menampilkan job/link | `platform` → icon YouTube/TikTok/IG/Twitter/FB |
| Toast Notification | Global | Muncul saat ada event WebSocket baru (`job:done`, `job:failed`, `batch:completed`) meski user tidak sedang di halaman terkait |

---

## 10. Ringkasan Peta Data ke Endpoint

| Halaman | Endpoint utama |
|---|---|
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/active-jobs`, `GET /dashboard/history` (limited) |
| Manajemen Drive | `GET /drive-accounts` |
| List Project | `GET /projects` |
| Detail Project | `GET /projects/:id`, `POST /links/validate`, `POST /projects/:id/jobs`, `GET /projects/:id/jobs` |
| Riwayat Download | `GET /dashboard/history` |
| Notifikasi | `GET /notifications` |
| Settings | data dari session/user object |
| Semua halaman (realtime) | WebSocket: `job:progress`, `job:done`, `job:failed`, `batch:completed` |
