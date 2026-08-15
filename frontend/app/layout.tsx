import { Figtree, Inter_Tight, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/app/providers";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
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
      lang="en"
      className={`${interTight.variable} ${figtree.variable} ${splineMono.variable}`}
    >
      <body className="font-body bg-bg-base text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
