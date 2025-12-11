"use client";

import { Heart, Terminal } from "lucide-react";

interface FooterProps {
  status: string;
}

export default function Footer({ status }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 w-full p-4 border-t border-border bg-card/80 backdrop-blur-md flex items-center justify-between text-xs font-mono text-muted z-10">

      {/* GAUCHE : Statut du serveur */}
      <div className="flex items-center gap-2">
        <span className={`relative flex h-2 w-2`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.includes("🟢") ? "bg-green-500" : "bg-red-500"}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.includes("🟢") ? "bg-green-500" : "bg-red-500"}`}></span>
        </span>
        <span className="uppercase tracking-wider">{status.replace("🟢", "").replace("🔴", "")}</span>
      </div>

      {/* DROITE : Crédits */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 hover:text-foreground transition cursor-default">
          Code avec <Heart className="w-3 h-3 text-red-500 fill-red-500" /> par <span className="font-bold text-foreground">Enzo </span>
        </span>

        <div className="h-3 w-px bg-border"></div>

        <span className="flex items-center gap-1 opacity-70 hover:opacity-100 transition">
          <Terminal className="w-3 h-3" />
          <span>Powered by yt-dlp</span>
        </span>
      </div>

    </footer>
  );
}