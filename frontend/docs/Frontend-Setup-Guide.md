# Frontend Setup Guide — Video Footage Downloader

Dokumen ini adalah acuan tunggal agar implementasi desain (dari `Design-System-Video-Footage-Downloader.md`) berjalan akurat sejak awal setup, bukan menyusul/diperbaiki belakangan. Tempel dokumen ini ke AI copilot di sesi setup pertama.

---

## 1. Dependency

### Perintah Install
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --eslint
cd frontend
npm install lucide-react framer-motion socket.io-client @tanstack/react-query zustand react-hook-form zod @hookform/resolvers date-fns class-variance-authority tailwind-merge clsx
npm install -D prettier prettier-plugin-tailwindcss
```

### Daftar & Fungsi
| Package | Fungsi |
|---|---|
| `next`, `react`, `react-dom` | Framework inti |
| `typescript` | Type safety |
| `tailwindcss` | Styling, tempat token desain didefinisikan |
| `class-variance-authority` | Variant komponen (Button primary/secondary/danger/ghost) |
| `tailwind-merge`, `clsx` | Gabung className aman, penting untuk atomic component |
| `lucide-react` | Icon set (dipakai monokrom, bukan warna brand platform) |
| `framer-motion` | Motion system (hover/press/sidebar/modal/toast) |
| `socket.io-client` | Koneksi WebSocket realtime progress |
| `@tanstack/react-query` | Fetch & cache data dari backend API |
| `zustand` | State ringan non-server (akun Drive aktif, sidebar state) |
| `react-hook-form` + `zod` + `@hookform/resolvers` | Form dinamis multi-link + validasi |
| `date-fns` | Format tanggal relatif |
| `prettier-plugin-tailwindcss` | Auto-sort className, disiplin urutan class |

---

## 2. Setup Token Desain di Tailwind Config

**File: `tailwind.config.ts`**
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#101418",
          surface: "#171B20",
          card: "#1D232A",
          elevated: "#232B34",
        },
        border: {
          DEFAULT: "rgba(255,255,255,.06)",
          hover: "rgba(61,217,196,.35)",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        primary: {
          DEFAULT: "#39D6C3",
          hover: "#4BE4D1",
          pressed: "#2BC0AE",
        },
        status: {
          success: "#22C55E",
          warning: "#F5B041",
          danger: "#EF4444",
          info: "#38BDF8",
        },
      },
      borderRadius: {
        card: "16px",
        button: "14px",
        input: "14px",
        dropdown: "16px",
        modal: "24px",
        sidebar: "24px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,.15)",
        "card-hover": "0 12px 32px rgba(0,0,0,.18)",
      },
      fontFamily: {
        heading: ["var(--font-outfit)"],
        body: ["var(--font-figtree)"],
        mono: ["var(--font-spline-mono)"],
      },
      fontSize: {
        hero: "48px",
        "page-title": "36px",
        "section-title": "28px",
        "card-title": "22px",
        subtitle: "18px",
      },
      maxWidth: {
        content: "1400px",
      },
      transitionDuration: {
        hover: "150ms",
        modal: "200ms",
        sidebar: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;
```

> **Wajib:** semua warna/radius/shadow di komponen HARUS memakai token ini (mis. `bg-bg-card`, `rounded-card`, `shadow-card`, `text-text-secondary`) — bukan nilai hex/px manual di className. Ini satu-satunya cara supaya desain tetap akurat & konsisten di semua komponen.

---

## 3. Setup Font

**File: `src/app/layout.tsx`**
```tsx
import { Outfit, Figtree, Spline_Sans_Mono } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${outfit.variable} ${figtree.variable} ${splineMono.variable}`}>
      <body className="font-body bg-bg-base text-text-primary">{children}</body>
    </html>
  );
}
```

**Aturan pakai font per elemen:**
- Judul halaman/card → `font-heading` (Outfit)
- Body/label/paragraf → `font-body` (Figtree, default)
- Durasi, timestamp, progress %, nama file → `font-mono` (Spline Sans Mono) — **wajib**, ini identitas signature "Timecode Strip"

---

## 4. Struktur Folder (Atomic Design)

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router — pages
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── drive-accounts/page.tsx
│   │   ├── history/page.tsx
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── atoms/                    # Badge, Button, Input, Avatar, MonoText, Icon, Spinner
│   │   ├── molecules/                # StatusBadge, ProgressStrip, PlatformIcon, StorageBar, ThumbnailPreview
│   │   ├── organisms/                # JobRow, LinkInputForm, ProjectCard, Navbar, Sidebar, NotificationPanel
│   │   └── templates/                # DashboardTemplate, ProjectDetailTemplate (70/30), AuthTemplate, SettingsTemplate
│   ├── lib/
│   │   ├── api.ts                    # wrapper fetch/axios ke backend REST API
│   │   ├── socket.ts                 # setup socket.io-client
│   │   └── queryClient.ts            # setup React Query
│   ├── stores/                       # zustand stores
│   ├── hooks/                        # custom hooks (mis. useJobProgress, useDriveAccounts)
│   ├── types/                        # shared TypeScript types (samakan dengan tipe data di API Spec backend)
│   └── styles/
│       └── globals.css
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 5. Environment Variables

**File: `.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## 6. Checklist Akurasi Desain — Cek Sebelum Anggap Selesai

Gunakan checklist ini tiap kali AI copilot selesai membuat komponen/halaman:

- [ ] Tidak ada warna hex manual di className — semua lewat token (`bg-primary`, `text-status-danger`, dst)
- [ ] Radius pakai token (`rounded-card`, `rounded-button`) — bukan `rounded-lg`/`rounded-xl` default Tailwind
- [ ] Shadow pakai token (`shadow-card`) — bukan `shadow-md`/`shadow-lg` default
- [ ] Semua angka teknis (durasi, timestamp, progress %, nama file) pakai `font-mono`
- [ ] Icon platform monokrom (`text-text-secondary`), tidak pakai warna brand asli
- [ ] Komponen baru ditaruh di layer atomic yang benar (atom tidak boleh import dari molecule/organism)
- [ ] Motion pakai durasi token (150/200/250ms), tidak ada animasi dekoratif di elemen statis
- [ ] Sidebar dirender sebagai panel mengambang (margin dari tepi), bukan menempel penuh ke layar
- [ ] Detail Project pakai layout 2 kolom 70/30 (workspace + sidebar info), bukan halaman single-column form+list

---

## 7. Urutan Setup yang Disarankan

1. Install dependency (bagian 1)
2. Setup `tailwind.config.ts` (bagian 2)
3. Setup font di `layout.tsx` (bagian 3)
4. Buat struktur folder kosong (bagian 4)
5. Setup `.env.local` (bagian 5)
6. Baru mulai bangun atoms → molecules → organisms → templates → pages (rujuk `Cara-Prompting-Design-Ke-AI-Copilot.md`)
7. Tiap komponen/halaman selesai, cek checklist bagian 6 sebelum lanjut ke berikutnya
