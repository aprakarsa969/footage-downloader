# Design System: Video Footage Downloader
## Modern Productivity Workspace — Rounded, Clean, Premium

> Versi ini menggantikan arah desain sebelumnya ("editing panel" flat/gelap-tegas). Redesign mengikuti brief: workspace modern ala Linear/Raycast/Arc Browser/Dropbox Dash — rounded besar, shadow halus, whitespace lega — namun tetap mempertahankan identitas inti: teal sebagai warna utama, Spline Sans Mono untuk data teknis, dan signature element **Timecode Strip**.

---

## 1. Design Vision

**Tujuan:** aplikasi terasa seperti modern productivity workspace yang profesional, bersih, dan nyaman dipakai lama — bukan dashboard admin generik — sambil tetap punya identitas sebagai tools video editor/content creator.

**Karakter:** Modern • Clean • Rounded • Minimal • Fast Workflow • Comfortable UX • Premium

**Referensi:** Linear, Raycast, Arc Browser, Dropbox Dash, Notion Calendar, Figma Desktop — banyak whitespace, radius besar, shadow sangat halus, tipografi kuat, warna tenang, navigasi sederhana, fokus ke konten.

---

## 2. Token System

### Warna — Background
| Token | Value |
|---|---|
| `--bg-base` | `#101418` |
| `--bg-surface` | `#171B20` |
| `--bg-card` | `#1D232A` |
| `--bg-elevated` | `#232B34` |

### Warna — Border
| Token | Value |
|---|---|
| `--border-default` | `rgba(255,255,255,.06)` |
| `--border-hover` | `rgba(61,217,196,.35)` |

### Warna — Teks
| Token | Value |
|---|---|
| `--text-primary` | `#F8FAFC` |
| `--text-secondary` | `#94A3B8` |
| `--text-muted` | `#64748B` |

### Warna — Primary (Teal)
| Token | Value |
|---|---|
| `--primary` | `#39D6C3` |
| `--primary-hover` | `#4BE4D1` |
| `--primary-pressed` | `#2BC0AE` |

### Warna — Status
| Token | Value |
|---|---|
| `--status-success` | `#22C55E` |
| `--status-warning` | `#F5B041` |
| `--status-danger` | `#EF4444` |
| `--status-info` | `#38BDF8` |

Aturan pakai tetap sama seperti sebelumnya: **teal** untuk aksi utama & progres positif; **warning (amber)** khusus dipakai untuk elemen terkait timestamp/trim, supaya asosiasinya konsisten di seluruh aplikasi.

### Tipografi
| Peran | Font |
|---|---|
| Heading | Space Grotesk |
| Body | Inter |
| Technical Data (durasi, timestamp, progress %, nama file) | Spline Sans Mono |

**Scale:**
| Size (px) | Peran |
|---|---|
| 48 | Hero |
| 36 | Page Title |
| 28 | Section Title |
| 22 | Card Title |
| 18 | Subtitle |
| 16 | Body |
| 14 | Caption |
| 12 | Helper |

### Radius System
Semua komponen dibuat **lebih rounded** dari versi sebelumnya — ini perubahan arah paling signifikan dibanding draf awal (dulu flat/radius kecil, sekarang besar & lembut, meniru Linear/Arc).

| Komponen | Radius |
|---|---|
| Card | 16px |
| Button | 14px |
| Input | 14px |
| Dropdown | 16px |
| Modal | 24px |
| Sidebar | 24px |
| Badge | Full pill |
| Avatar | Circle |

### Shadow System
Shadow dipakai halus, untuk bantu depth — bukan dekorasi:
```css
Card:  0 8px 24px rgba(0,0,0,.15)
Hover: 0 12px 32px rgba(0,0,0,.18)
```

### Layout
- **Sidebar:** width 272px, padding 24px, radius 24px, margin 16px — didesain sebagai panel yang **mengambang** (tidak menempel ke tepi layar)
- **Content:** max-width 1400px, padding 32px
- **Grid:** 12 kolom (desktop), gap 24px

---

## 3. Signature Element: Timecode Strip (tetap dipertahankan)

Elemen unik yang jadi identitas aplikasi tetap dipakai, tapi tampilannya dibuat lebih modern/lega mengikuti arah baru:

```
█████████░░░░░  68%
00:01:32 tersisa
```

Progress bar teal dengan animasi smooth continuous, label persentase & waktu tersisa pakai Spline Sans Mono. Ini elemen yang membedakan aplikasi ini dari workspace tool generik — tetap dipertahankan di semua konteks progress meski keseluruhan visual sudah lebih rounded & lega.

**Implementasi:** nilai `percent` pada molecule `ProgressStrip` di-drive oleh event `job:progress` dari `socket.io-client` (bukan polling) — dikelola lewat custom hook `useJobProgress(jobId)` yang subscribe ke room `user:{user_id}` dan update state lokal tiap event masuk. React Query dipakai untuk data awal (fetch sekali saat halaman dibuka), sementara WebSocket meng-override nilai `percent`/`status` secara realtime setelahnya.

---

## 4. Navigasi

### Sidebar
Sidebar berbentuk panel mengambang (radius 24px, margin 16px dari tepi), bukan menempel ke tepi layar:
```
┌───────────────────────┐
  LOGO

  Dashboard
  Projects
  Downloads
  Drive
  History
  ─────────────
  Settings
  Avatar
└───────────────────────┘
```

### Navbar
Sederhana: Search — Notification — Theme — Avatar. Search selalu tersedia di navbar karena jumlah project akan terus bertambah seiring pemakaian.

**Implementasi ikon navigasi:** semua ikon (Dashboard/Projects/Downloads/Drive/History/Settings di sidebar; Search/Notification di navbar) pakai `lucide-react`, warna `text-text-secondary` default dan berubah `text-primary` saat item aktif — tanpa background solid di belakang ikon aktif, cukup perubahan warna teks + ikon (konsisten dengan prinsip "flat, bukan dekoratif berlebihan"). Badge counter notifikasi (jumlah unread) pakai atom `Badge` variant kecil, `rounded-full`, `bg-status-danger`.

---

## 5. Penerapan per Halaman

### Login Page
- Panel tunggal di tengah, radius besar (24px), shadow halus mengambang di atas background gelap polos
- Satu CTA jelas: "Continue with Google", teal solid, radius 14px

### Dashboard
Layout diubah fokus ke **workflow**, bukan statistik:
```
Storage Card + Quick Action
──────────────────────────
Active Download
──────────────────────────
Recent Projects
──────────────────────────
History (ringkas)
```
**Quick Action** (selalu terlihat di atas): New Project, Download Link, Connect Google Drive.
Statistik/ringkasan angka digeser lebih ke bawah, prioritas utama adalah apa yang sedang berjalan (active download) dan aksi cepat berikutnya.

### Manajemen Akun Drive
Card rounded (16px) per akun, storage bar pakai gaya Timecode Strip, shadow halus saat hover.

### List Project
Card project, isi:
- Thumbnail
- Nama project
- Jumlah footage
- Total size
- Last updated

**Hover state:** border berubah teal, shadow naik sedikit, scale ~1%.

### Detail Project — Workspace Layout
Diubah dari form-sentris jadi **dua panel dalam satu layar** (tidak perlu pindah halaman):
```
70%  →  Project Workspace (input URL, queue, download progress, thumbnail preview)
30%  →  Project Sidebar (storage, statistics, recent activity, project info)
```
Semua informasi penting — status job, storage, aktivitas terakhir — terlihat sekaligus tanpa navigasi tambahan. Ini perubahan UX terbesar dari versi sebelumnya: dulu list job terpisah di bawah form, sekarang jadi workspace terpadu dua kolom.

### Riwayat Download
- **Desktop:** table (tetap, karena ini halaman data/log)
- **Mobile:** list card, bukan table dipaksa responsive — lebih nyaman dibaca di layar kecil

### Notifikasi
Dropdown panel dari navbar, radius besar, shadow halus, dot teal untuk unread (merah tetap dikhususkan untuk error/danger saja).

### Settings
Form single column, max-width sempit, input height 48px radius 14px — konsisten dengan form system di bagian 7.

---

## 6. Komponen

### Button System
| Variant | Style |
|---|---|
| Primary | Background teal, radius 14px, height 44px, icon di kiri |
| Secondary | Surface + border, hover lebih terang |
| Danger | Background transparan merah, teks merah |
| Ghost | Tanpa background, hover surface |

**Implementasi:** dibangun dengan `class-variance-authority` (cva) — satu definisi variant di atom `Button`, bukan if/else className manual:
```ts
// components/atoms/Button.tsx
const buttonVariants = cva(
  "rounded-button font-body font-medium inline-flex items-center gap-2 transition-colors duration-hover active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-primary-hover active:bg-primary-pressed text-bg-base",
        secondary: "bg-bg-surface border border-border hover:border-border-hover text-text-primary",
        danger: "bg-status-danger/10 text-status-danger hover:bg-status-danger/20",
        ghost: "bg-transparent hover:bg-bg-surface text-text-primary",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-caption",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);
```
Icon di kiri tombol pakai `lucide-react`, ukuran 18px, mengikuti warna teks tombol (`currentColor`) — bukan warna hardcoded.

### Card
- Radius 16px, padding 24px, border tipis, shadow ringan
- Hover: shadow bertambah, border jadi teal, scale ~1%

### Form / Input
- Height 48px, radius 14px
- Placeholder pakai `--text-muted`
- Focus state: border teal + shadow sangat tipis

**Implementasi:** form dinamis (mis. `LinkInputForm` yang menambah banyak field link sekaligus) dibangun dengan `react-hook-form` — pakai `useFieldArray` untuk field yang bisa ditambah/dihapus — dikombinasikan dengan validasi schema `zod` via `@hookform/resolvers`. Error validasi (link invalid, format timestamp salah) ditampilkan sebagai teks kecil `text-status-danger` di bawah field, style input berubah border merah tipis saat invalid. Atom `Input` sendiri tetap generic (tidak tahu soal react-hook-form) — dikoneksikan lewat `register()`/`Controller` di level organism.

### Empty State
Sederhana, tanpa ilustrasi besar:
```
📂
Belum ada project.
Mulai project pertama Anda.
[ New Project ]
```

Ikon (📂 dsb) diganti dengan ikon `lucide-react` monokrom (`text-text-muted`, ukuran besar ~40px), bukan emoji — konsisten dengan aturan "tidak ada warna brand/dekoratif liar" di seluruh aplikasi.

### Mobile
Floating Action Button di kanan bawah untuk aksi utama (mis. "+ New Project") pada layar mobile. Ikon `Plus` dari `lucide-react`, tombol pakai `Button` variant `primary` bentuk circle (`rounded-full`), muncul dengan animasi scale-in (`framer-motion`) saat halaman dimuat.

---

## 7. Motion System
| Elemen | Durasi/Efek |
|---|---|
| Hover | 150ms |
| Button press | scale 0.98 |
| Sidebar | 250ms |
| Modal | 200ms |
| Toast | slide dari kanan |
| Progress | smooth animation (continuous, bukan step) |

Prinsip: tidak ada animasi dekoratif yang tidak punya fungsi — semua motion memberi feedback nyata (hover, tekan, proses berjalan).

**Implementasi:**
- **Hover & button press:** cukup Tailwind transition (`transition-colors duration-hover`, `active:scale-[0.98]`) — tidak perlu `framer-motion` untuk ini, terlalu ringan untuk butuh library animasi
- **Modal & Sidebar:** `framer-motion` (`AnimatePresence` + `motion.div`) untuk animasi masuk/keluar (`opacity` + `scale`/`translateY`), durasi sesuai token (`modal` 200ms, `sidebar` 250ms)
- **Toast:** `framer-motion`, `initial={{ x: 100, opacity: 0 }}` → `animate={{ x: 0, opacity: 1 }}`, slide dari kanan, auto-dismiss pakai `setTimeout` dikombinasikan dengan `exit` animation saat notifikasi ditutup
- **Progress bar (`ProgressStrip`):** transisi width via `framer-motion` `motion.div` dengan `animate={{ width: `${percent}%` }}` dan `transition={{ ease: "easeOut", duration: 0.4 }}` — smooth tiap kali `percent` berubah dari event WebSocket, bukan lompatan tiba-tiba

---

## 8. Prinsip Desain (Ringkasan)
- Less click, more focus
- Better hierarchy
- Spacious layout
- Rounded interface
- Consistent components
- Premium productivity experience

**Identitas yang tetap dipertahankan** dari arah sebelumnya: workspace untuk video editor, Timecode Strip, Spline Sans Mono untuk data teknis, teal sebagai warna utama, dan workflow yang berorientasi ke proses download footage. Yang berubah adalah *bagaimana* itu ditampilkan — dari flat/tegas ala editing panel, menjadi rounded/lega ala SaaS premium 2026, memadukan karakter Linear, Arc Browser, Raycast, dan Dropbox Dash.

---

## 9. Rekomendasi Implementasi Frontend (Atomic Design)

Struktur folder komponen tetap mengikuti Atomic Design seperti sebelumnya (`atoms` → `molecules` → `organisms` → `templates` → `app/pages`). Yang berubah hanya **nilai token** (warna, radius, shadow) yang mengalir ke `atoms` — jadi seluruh sistem otomatis ikut ter-update begitu token di layer atom direvisi, tanpa perlu menyentuh molecules/organisms/templates satu-satu.

```
src/components/
├── atoms/       # Badge, Button, Input, Avatar, MonoText, Icon, Spinner — pakai token baru di atas
├── molecules/   # StatusBadge, ProgressStrip (Timecode Strip), PlatformIcon, StorageBar, dll
├── organisms/   # JobRow, LinkInputForm, ProjectCard, Navbar (sidebar mengambang), dll
├── templates/   # DashboardTemplate (layout workflow-first), ProjectDetailTemplate (70/30 workspace), dll
```

Catatan implementasi penting:
- Card, Button, Input di layer **atom** perlu diperbarui radius & shadow-nya sesuai token baru — begitu atom ini diupdate, seluruh aplikasi (yang sudah dibangun sesuai atomic design) otomatis ikut berubah tampilannya
- `ProjectDetailTemplate` perlu di-restrukturisasi dari layout sebelumnya (form + list terpisah) menjadi grid 2 kolom 70/30
- `DashboardTemplate` perlu diurut ulang: Quick Action & Active Download di atas, statistik/summary digeser ke bawah

---

## 10. Pemetaan Dependency ke Elemen Desain

Ringkasan dependency mana bertanggung jawab atas bagian desain yang mana — dipakai sebagai acuan supaya AI copilot tidak salah pilih tool (mis. pakai CSS animation manual padahal seharusnya `framer-motion`, atau menulis if/else variant padahal seharusnya `cva`):

| Dependency | Bertanggung jawab atas |
|---|---|
| `class-variance-authority` (cva) | Variant komponen: `Button` (primary/secondary/danger/ghost), `Badge`/`StatusBadge`, ukuran komponen (`sm`/`default`) |
| `tailwind-merge` + `clsx` | Utility `cn()` untuk menggabungkan className token dengan className tambahan dari props — dipakai di semua atom/molecule agar bisa di-override parent tanpa konflik |
| `lucide-react` | Semua ikon: navigasi sidebar/navbar, `PlatformIcon` (monokrom), ikon di dalam `Button`, ikon Empty State, ikon FAB mobile |
| `framer-motion` | Animasi Modal & Sidebar (masuk/keluar), Toast (slide dari kanan), `ProgressStrip` (transisi width smooth), FAB scale-in |
| `socket.io-client` | Data realtime `ProgressStrip` & `StatusBadge` di `JobRow` (event `job:progress`/`job:done`/`job:failed`), trigger Toast saat `batch:completed` |
| `@tanstack/react-query` | Fetch data awal semua halaman (summary, list project, history, notifications) + cache & refetch, dikombinasikan dengan override dari WebSocket untuk data yang realtime |
| `react-hook-form` + `zod` | `LinkInputForm` (dynamic field tambah link), form Settings, form buat/edit Project — termasuk validasi & pesan error di bawah `Input` |
| `zustand` | State non-server: akun Drive aktif yang dipilih, status collapse Sidebar, filter aktif di Riwayat Download |
| `date-fns` | Format tanggal relatif di Notifikasi & Riwayat ("2 jam lalu") — bukan raw ISO string |

**Aturan tambahan untuk AI copilot:** kalau butuh animasi/variant/form baru, cek tabel ini dulu — pakai dependency yang sudah ada, jangan menambah library baru atau menulis ulang logic yang sudah dicover salah satu dependency di atas (mis. jangan bikin sistem variant manual kalau `cva` sudah dipasang).
