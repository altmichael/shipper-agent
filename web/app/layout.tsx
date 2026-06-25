import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "The Shipper Agent — Stop building. Start shipping.",
  description:
    "An AI co-founder that diagnoses why you're stalling and forces you to ship. No therapy. No checklists. Just momentum.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
