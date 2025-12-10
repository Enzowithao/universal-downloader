"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Link2, Loader2, Clipboard } from "lucide-react";
import { toast } from "sonner";

interface SearchBarProps {
  onSearch?: (url: string) => void;
  isLoading?: boolean;
}

// --- CONFIGURATION DES LOGOS ---
// On fait correspondre le nom interne (clé) avec ton fichier réel (valeur)
const logoMap: Record<string, string> = {
  youtube: "/Logos/Youtube_logo.png",
  tiktok: "/Logos/tiktok.png",
  spotify: "/Logos/spotify.png",
  x: "/Logos/X-Logo.png"
};

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault(); 
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    detectPlatform(value);
  };

  const detectPlatform = (link: string) => {
    const lower = link.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) return setPlatform("youtube");
    if (lower.includes("tiktok.com")) return setPlatform("tiktok");
    if (lower.includes("spotify.com")) return setPlatform("spotify");
    if (lower.includes("x.com") || lower.includes("twitter.com")) return setPlatform("x");
    
    setPlatform(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);          
        detectPlatform(text);  
        toast.success("Lien collé !"); 
      } else {
        toast.info("Presse-papier vide");
      }
    } catch (err) {
      console.error(err);
      toast.error("Accès presse-papier refusé");
    }
  };

  const handleSubmit = () => {
    if (url.trim().length > 0 && onSearch) {
      onSearch(url);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl relative z-10">
      
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg ${
            platform === 'youtube' ? 'bg-red-600' :
            platform === 'tiktok' ? 'bg-cyan-500' :
            platform === 'spotify' ? 'bg-green-500' :
            'bg-blue-600'
        }`}></div>

        <div className="relative flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-2 shadow-2xl">
          
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-neutral-800 ml-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {platform && logoMap[platform] ? (
                <motion.img
                  key={platform}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 20 }}
                  src={logoMap[platform]} // Utilise le bon chemin défini en haut
                  alt={platform}
                  className="w-8 h-8 object-contain" // Ajusté pour le PNG
                  onError={(e) => { 
                      // Cache l'image si elle ne charge pas
                      (e.target as HTMLImageElement).style.display = 'none'; 
                  }}
                />
              ) : (
                <motion.div
                  key="default"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Search className="w-5 h-5 text-neutral-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={handleInput}
            onKeyDown={handleInputKeyDown}
            disabled={isLoading}
            placeholder="Colle un lien YouTube, TikTok, Spotify..."
            className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 placeholder-neutral-500 font-medium disabled:opacity-50 min-w-0"
          />

          {!url && (
            <div className="hidden md:flex items-center gap-1 mr-3 pointer-events-none select-none">
                <kbd className="h-5 min-w-[20px] flex items-center justify-center rounded bg-neutral-800 border border-neutral-700 text-[10px] font-sans text-neutral-500">
                    /
                </kbd>
            </div>
          )}

          {!url && (
            <button
                onClick={handlePaste}
                className="p-2 mr-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                title="Coller (ou Ctrl+V)"
            >
                <Clipboard className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence>
            {url.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-white text-black p-2 rounded-lg hover:bg-neutral-200 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <ArrowRight className="w-5 h-5" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-4 text-xs font-mono text-neutral-500">
        <span className="flex items-center gap-1"><Link2 className="w-3 h-3"/> Auto-detect</span>
        <span>•</span>
        <span>MP4 & MP3</span>
        <span>•</span>
        <span>No Ads</span>
      </div>
    </div>
  );
}