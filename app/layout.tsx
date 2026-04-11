import type { Metadata } from "next";
import { Noto_Serif_SC, Geist } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { AppFooter } from "@/components/AppFooter";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/PageTransition";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-sc",
});

export const metadata: Metadata = {
  title: "圆桌",
  description: "你出一个题，主持控场，多种视角依次发言，最后收束成篇。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn(geist.variable, notoSerif.variable)}>
      <body className={cn("min-h-screen font-serif antialiased")}>
        <div className="ink-page-bg" aria-hidden />
        <div className="relative z-[1] flex min-h-screen flex-col">
          <AppNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            <PageTransition>{children}</PageTransition>
          </main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
