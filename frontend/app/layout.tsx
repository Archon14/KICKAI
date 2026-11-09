import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavSidebar from "@/components/NavSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kick AI — Football Intelligence",
  description:
    "Football intelligence — tactical predictions, adaptive football coaching, auto-match analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="emerald" className={`${inter.variable} dark`}>
      <body className="bg-[var(--kick-bg)] text-[var(--kick-text)] antialiased flex h-screen overflow-hidden selection:bg-[var(--kick-primary)]">
        <NavSidebar />
        <main className="flex-1 overflow-y-auto bg-[var(--kick-bg)] p-6 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
