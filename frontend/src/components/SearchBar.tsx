"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Link2, Loader2, Clipboard, X } from "lucide-react";
import { useClickOutside } from "@mantine/hooks"; // <-- Added missing import
import { toast } from "sonner";

// --- CONFIGURATION DES LOGOS ---
// On fait correspondre le nom interne (clé) avec ton fichier réel (valeur)
const logoMap: Record<string, string> = {
  youtube: "/Logos/Youtube_logo.png",
  tiktok: "/Logos/tiktok.png",
  instagram: "/Logos/instagram.png",
  x: "/Logos/X-Logo.png"
};

interface SearchBarProps {
  onSearchStart: (url: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearchStart, isLoading }: SearchBarProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useClickOutside(() => setIsFocused(false)); // <-- Using Mantine Hook

  const detectPlatform = (link: string) => {
    const lower = link.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
    if (lower.includes("tiktok.com")) return "tiktok";
    if (lower.includes("instagram.com")) return "instagram";
    if (lower.includes("x.com") || lower.includes("twitter.com")) return "x";
    return null;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    const detected = detectPlatform(val);
    setPlatform(detected);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setPlatform(detectPlatform(text));
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
    if (!url.trim()) return;
    onSearchStart(url);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  return (
    <div ref={containerRef} className="w-full max-w-2xl relative z-10">

      <div className="relative group">
        <motion.div
          animate={{
            opacity: isFocused ? 0.6 : 0.2,
            filter: isFocused ? "blur(20px)" : "blur(10px)",
            scale: isFocused ? 1.02 : 1
          }}
          transition={{ duration: 0.3 }}
          className={`absolute -inset-1 rounded-xl transition duration-500 ${platform === 'youtube' ? 'bg-red-600' :
            platform === 'tiktok' ? 'bg-cyan-500' :
              platform === 'instagram' ? 'bg-pink-600' :
                'bg-blue-600'
            }`}
        ></motion.div>

        <div className="relative flex items-center bg-card border border-border rounded-xl p-2 shadow-2xl transition-colors duration-300 focus-within:border-accent">

          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-background/50 ml-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {platform && logoMap[platform] ? (
                <motion.img
                  key={platform}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 20 }}
                  src={logoMap[platform]}
                  alt={platform}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
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
                  <Search className="w-5 h-5 text-muted" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={handleInput}
            onFocus={() => setIsFocused(true)}
            // onBlur removed, managed by useClickOutside
            onKeyDown={handleInputKeyDown}
            disabled={isLoading}
            placeholder="Colle un lien YouTube, TikTok, Instagram..."
            className="flex-1 bg-transparent border-none outline-none text-foreground px-4 py-3 placeholder:text-muted font-medium disabled:opacity-50 min-w-0"
          />

          {/* ... Hotkey badge ... */}
          {!url && (
            <div className="hidden md:flex items-center gap-1 mr-3 pointer-events-none select-none">
              <kbd className="kbd kbd-sm bg-muted/20 border-border text-muted">
                /
              </kbd>
            </div>
          )}

          {/* ... Paste button ... */}
          {!url && (
            <button
              onClick={handlePaste}
              className="p-2 mr-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-lg transition"
              title="Coller (ou Ctrl+V)"
            >
              <Clipboard className="w-5 h-5" />
            </button>
          )}

          {/* ... Clear button ... */}
          {url && (
            <button
              onClick={() => { setUrl(''); setPlatform(null); }}
              className="p-2 mr-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* ... Submit button ... */}
          <AnimatePresence>
            {url.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center justify-center bg-accent text-white h-10 w-10 p-2 rounded-lg hover:bg-accent/90 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
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

      <div className="mt-4 flex justify-center gap-4 text-xs font-mono text-muted">
        <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Auto-detect</span>
        <span>•</span>
        <span className="px-2 py-0.5 rounded bg-muted/20 border border-transparent text-muted text-[10px] font-bold uppercase">MP4 & MP3</span>
        <span>•</span>
        <span>No Ads</span>
      </div>
    </div>
  );
}