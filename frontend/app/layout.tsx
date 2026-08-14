import { Figtree, Outfit, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/app/providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
