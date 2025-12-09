"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Music, Video, X, User, Clock, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface VideoData {
  title: string;
  thumbnail: string;
  uploader: string;
  avatar?: string | null;
  duration: string;
  views?: number;
  original_url?: string; 
  options: { type: string; quality: string; ext: string; size: string }[];
}

interface VideoCardProps {
  data: VideoData;
  onReset: () => void;
}

const formatViews = (num?: number) => {
  if (!num) return "N/A";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

// --- FONCTION CONFETTIS (Corrigée pour TS) ---
const fireConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#8b5cf6', '#3b82f6', '#ffffff', '#a855f7'],
    disableForReducedMotion: true
  };

  // On utilise 'any' pour 'opts' afin d'éviter les erreurs de types stricts ici
  function fire(particleRatio: number, opts: any) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

export default function VideoCard({ data, onReset }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  const handleDownload = async (opt: any, index: number) => {
    setDownloadingIndex(index);

    try {
        const downloadUrl = `http://127.0.0.1:8000/api/download?url=${encodeURIComponent(data.original_url || "")}&type=${opt.type}&quality=${opt.quality}`;
        
        // 1. DÉCLENCHEMENT DU TÉLÉCHARGEMENT
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 2. SAUVEGARDE DANS L'HISTORIQUE
        const historyItem = {
            id: Date.now(),
            title: data.title,
            thumbnail: data.thumbnail,
            uploader: data.uploader,
            url: data.original_url || "",
            type: opt.type,
            quality: opt.quality,
            date: new Date().toLocaleDateString()
        };

        // On précise à TS que c'est un tableau de n'importe quoi (any[]) pour éviter les conflits
        const storedHistory = localStorage.getItem('dl_history');
        const currentHistory: any[] = storedHistory ? JSON.parse(storedHistory) : [];
        
        // Filtrage des doublons
        const newHistory = [historyItem, ...currentHistory].filter((item, idx, self) => 
            idx === self.findIndex((t) => (
                t.title === item.title && t.quality === item.quality
            ))
        ).slice(0, 10);
        
        localStorage.setItem('dl_history', JSON.stringify(newHistory));
        
        // Dispatch de l'événement
        window.dispatchEvent(new Event("historyUpdated"));

        // 3. SUCCÈS
        toast.success(`Téléchargement ${opt.quality} lancé 🚀`);
        fireConfetti();
        
        setTimeout(() => setDownloadingIndex(null), 4000);

    } catch (error) {
        console.error("Download error", error);
        setDownloadingIndex(null);
        toast.error("Le téléchargement a échoué.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-4xl mx-auto mt-8 relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000"></div>

      <div className="relative bg-[#0a0a0a] border border-neutral-800 rounded-[1.8rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* GAUCHE */}
        <div className="md:w-5/12 relative h-64 md:h-auto overflow-hidden">
          <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700 ease-in-out"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0a0a0a]" />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
            <Clock className="w-3 h-3 text-neutral-300" />
            {data.duration}
          </div>
        </div>

        {/* DROITE */}
        <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between relative">
          <button onClick={onReset} className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition border border-transparent hover:border-neutral-700 z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400 md:pr-10">{data.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-200">
                {data.avatar && !imgError ? (
                  <img src={data.avatar} alt={data.uploader} className="w-5 h-5 rounded-full object-cover shadow-sm" onError={() => setImgError(true)}/>
                ) : (<User className="w-4 h-4 text-purple-400" />)}
                <span className="truncate max-w-[150px]">{data.uploader}</span>
              </div>
              {data.views != null && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-neutral-400">
                  <Eye className="w-4 h-4" />
                  <span>{formatViews(data.views)} vues</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="h-px flex-1 bg-neutral-800"></span>
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Formats Disponibles</span>
                <span className="h-px flex-1 bg-neutral-800"></span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {data.options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleDownload(opt, i)}
                  disabled={downloadingIndex !== null}
                  className="group cursor-pointer relative overflow-hidden flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${
                        opt.type === 'video' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                        {opt.type === 'video' ? <Video className="w-5 h-5"/> : <Music className="w-5 h-5"/>}
                    </div>
                    
                    <div className="text-left">
                        <div className="text-white font-semibold text-sm flex items-center gap-2">
                            {opt.quality} 
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300 font-mono">
                                {opt.ext.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-neutral-500 text-xs mt-0.5">{opt.size}</div>
                    </div>
                  </div>

                  <div className="relative z-10 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                    {downloadingIndex === i ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}