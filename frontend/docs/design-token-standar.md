# Design Token & Font Standard
## Video Footage Downloader — Acuan Wajib untuk AI Copilot

> Dokumen ini adalah **satu-satunya sumber kebenaran** untuk warna, radius, shadow, tipografi, spacing, dan motion di seluruh aplikasi. Tempel dokumen ini di setiap sesi kerja dengan AI copilot yang menyentuh UI — jangan biarkan AI copilot menerka atau memakai nilai default Tailwind.

---

## 1. Setup Tailwind Config

**File: `tailwind.config.ts`** — salin persis, jangan diringkas:

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
        body: "16px",
        caption: "14px",
        helper: "12px",
      },
      spacing: {
        18: "4.5rem",
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

---

## 2. Setup Font

**File: `src/app/layout.tsx`** — salin persis:

```tsx
import { Outfit, Figtree, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

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
    <html
      lang="id"
      className={`${outfit.variable} ${figtree.variable} ${splineMono.variable}`}
    >
      <body className="font-body bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
```

**File: `src/styles/globals.css`** — tambahkan base Tailwind seperti biasa:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 3. Tabel Referensi Token (Ringkas, untuk Dicek Cepat)

### Warna
| Token Tailwind | Value | Peran |
|---|---|---|
| `bg-bg-base` | `#101418` | Background utama halaman |
| `bg-bg-surface` | `#171B20` | Panel/sidebar |
| `bg-bg-card` | `#1D232A` | Card |
| `bg-bg-elevated` | `#232B34` | Modal, dropdown, elemen mengambang |
| `border-border` / `border-border-hover` | `rgba(255,255,255,.06)` / `rgba(61,217,196,.35)` | Border default & hover |
| `text-text-primary` | `#F8FAFC` | Teks utama |
| `text-text-secondary` | `#94A3B8` | Label, caption, icon monokrom |
| `text-text-muted` | `#64748B` | Placeholder, teks tidak aktif |
| `bg-primary` / `bg-primary-hover` / `bg-primary-pressed` | `#39D6C3` / `#4BE4D1` / `#2BC0AE` | Warna utama (teal) — aksi & progres |
| `bg-status-success` | `#22C55E` | Status done/berhasil |
| `bg-status-warning` | `#F5B041` | Timestamp/trim, peringatan |
| `bg-status-danger` | `#EF4444` | Error/failed |
| `bg-status-info` | `#38BDF8` | Info netral |

### Radius
| Token Tailwind | Value | Dipakai untuk |
|---|---|---|
| `rounded-card` | 16px | Card |
| `rounded-button` | 14px | Button |
| `rounded-input` | 14px | Input |
| `rounded-dropdown` | 16px | Dropdown |
| `rounded-modal` | 24px | Modal |
| `rounded-sidebar` | 24px | Legacy (sidebar kini `rounded-dropdown` 16px) |
| `rounded-full` | — | Badge, Avatar (pill/circle) |

### Shadow
| Token Tailwind | Value | Dipakai untuk |
|---|---|---|
| `shadow-card` | `0 8px 24px rgba(0,0,0,.15)` | Card default |
| `shadow-card-hover` | `0 12px 32px rgba(0,0,0,.18)` | Card saat hover |

### Font
| Token Tailwind | Font | Dipakai untuk |
|---|---|---|
| `font-heading` | Outfit | Judul halaman, judul card, angka besar dashboard |
| `font-body` | Figtree | Body text, label, paragraf (default) |
| `font-mono` | Spline Sans Mono | **Wajib** untuk: durasi video, timestamp trim, progress percent, nama file, status code |

### Ukuran Font
| Token Tailwind | Value | Dipakai untuk |
|---|---|---|
| `text-hero` | 48px | Hero (jarang dipakai) |
| `text-page-title` | 36px | Judul halaman |
| `text-section-title` | 28px | Judul section |
| `text-card-title` | 22px | Judul card |
| `text-subtitle` | 18px | Subjudul |
| `text-body` | 16px | Body |
| `text-caption` | 14px | Caption |
| `text-helper` | 12px | Helper text terkecil |

### Motion
| Token Tailwind | Value | Dipakai untuk |
|---|---|---|
| `duration-hover` | 150ms | Hover state |
| `duration-modal` | 200ms | Buka/tutup modal |
| `duration-sidebar` | 250ms | Transisi sidebar |
| — | scale `0.98` | Button press (via `active:scale-[0.98]`) |

---

## 4. Aturan Wajib untuk AI Copilot

Tegaskan aturan ini di setiap prompt yang menyentuh styling:

1. **Semua warna, radius, shadow, font WAJIB lewat token di atas.** Tidak boleh ada hex/px manual (`#39D6C3`, `border-radius: 16px`) langsung di className atau inline style.
2. **Tidak boleh pakai kelas default Tailwind untuk radius/shadow** seperti `rounded-lg`, `rounded-xl`, `shadow-md`, `shadow-lg` — harus pakai token (`rounded-card`, `shadow-card`).
3. **Semua angka teknis wajib `font-mono`** — durasi, timestamp, persen progress, nama file. Kalau AI copilot merender angka-angka ini dengan font default (Inter), itu salah dan harus diperbaiki.
4. **Icon platform (YouTube/TikTok/IG/dll) wajib monokrom** (`text-text-secondary`), tidak boleh pakai warna brand asli.
5. **Warna status (`status-success/warning/danger/info`) hanya dipakai untuk konteks status/feedback**, bukan sebagai warna dekoratif bebas.

---

## 5. Prompt Standar untuk Memulai Sesi UI Baru

Gunakan prompt pembuka ini setiap kali mulai sesi baru dengan AI copilot yang menyentuh tampilan:

> Sebelum membuat/mengedit komponen apapun, ikuti standar desain berikut sebagai acuan wajib — jangan pakai nilai default Tailwind untuk warna/radius/shadow/font:
>
> [Tempel seluruh isi dokumen `Design-Token-Standard.md` ini]
>
> Konfirmasi dulu kamu sudah memahami token ini sebelum lanjut membuat komponen.