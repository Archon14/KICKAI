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
    "Physics-grounded football analytics, Monte Carlo match simulation, and tactical decision lab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#09090b] text-zinc-100 antialiased flex h-screen overflow-hidden selection:bg-zinc-800">
        <NavSidebar />
        <main className="flex-1 overflow-y-auto bg-[#09090b] p-6 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
