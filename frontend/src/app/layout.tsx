import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. IMPORT DE SONNER
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Universal Downloader - MP4 & MP3",
  description: "Télécharge tes vidéos préférées depuis YouTube, TikTok, X et plus.",
  icons: {
    icon: "/logo.svg", // <-- On pointe vers notre nouveau fichier
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        {/* 2. ON AJOUTE LE COMPOSANT TOASTER ICI */}
        <Toaster position="bottom-center" theme="dark" /> 
      </body>
    </html>
  );
}