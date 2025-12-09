"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History as HistoryIcon, Trash2, Video, Music, Play } from "lucide-react";

interface HistoryItem {
  id: number;
  title: string;
  thumbnail: string;
  uploader: string;
  url: string;
  type: string;
  quality: string;
  date: string;
}

interface HistoryProps {
  onSelect: (url: string) => void;
}

export default function History({ onSelect }: HistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Charger l'historique au démarrage
  const loadHistory = () => {
    const stored = localStorage.getItem('dl_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadHistory();

    // CORRECTION ICI : Ajout de "as any" pour éviter l'erreur TypeScript
    window.addEventListener("historyUpdated" as any, loadHistory);
    
    return () => {
        window.removeEventListener("historyUpdated" as any, loadHistory);
    };
  }, []);

  const clearHistory = () => {
    if(confirm("Tout effacer ?")) {
        localStorage.removeItem('dl_history');
        setHistory([]);
    }
  };

  const deleteItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('dl_history', JSON.stringify(newHistory));
  };

  if (history.length === 0) return null;

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mt-16 px-4 mb-20"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-neutral-400" />
          Récent
        </h3>
        <button 
            onClick={clearHistory}
            className="text-xs text-neutral-500 hover:text-red-400 transition flex items-center gap-1"
        >
            <Trash2 className="w-3 h-3" /> Tout effacer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
            {history.map((item) => (
            <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onSelect(item.url)}
                className="group relative bg-neutral-900/40 border border-neutral-800 hover:border-neutral-600 rounded-xl overflow-hidden cursor-pointer transition-all hover:bg-neutral-800/60"
            >
                {/* Image & Type */}
                <div className="relative h-32 w-full">
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                    
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                        item.type === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                        {item.type === 'video' ? <Video className="w-3 h-3"/> : <Music className="w-3 h-3"/>}
                        {item.quality}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                    </div>
                </div>

                {/* Infos */}
                <div className="p-3">
                    <h4 className="text-sm font-medium text-white line-clamp-1 mb-1">{item.title}</h4>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{item.uploader}</span>
                        <span>{item.date}</span>
                    </div>
                </div>

                <button 
                    onClick={(e) => deleteItem(e, item.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition"
                    title="Retirer de l'historique"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}