"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History as HistoryIcon, Trash2, Video, Music, Play, AlertTriangle } from "lucide-react"; // <-- Ajout AlertTriangle
import { toast } from "sonner";

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
  // Nouvel état pour gérer l'affichage de la modale
  const [showConfirm, setShowConfirm] = useState(false);

  const loadHistory = useCallback(() => {
    const stored = localStorage.getItem('dl_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener("historyUpdated", handleUpdate);
    return () => {
      window.removeEventListener("historyUpdated", handleUpdate);
    };
  }, [loadHistory]);

  // Fonction appelée quand on confirme VRAIMENT la suppression
  const confirmClear = () => {
    localStorage.removeItem('dl_history');
    setHistory([]);
    setShowConfirm(false);
    toast.success("Historique effacé !");
  };

  const deleteItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('dl_history', JSON.stringify(newHistory));
  };

  if (history.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mt-16 px-4 mb-20 relative z-0"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-neutral-400" />
            Récent
          </h3>
          <button
            onClick={() => setShowConfirm(true)} // On ouvre la modale au lieu de confirm()
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

                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${item.type === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                    {item.type === 'video' ? <Video className="w-3 h-3" /> : <Music className="w-3 h-3" />}
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

      {/* --- MODALE DE CONFIRMATION --- */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowConfirm(false)} // Ferme si on clique à côté
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique DANS la boîte
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Tout effacer ?</h3>
                  <p className="text-sm text-neutral-400">
                    Cette action est irréversible. Tout votre historique local sera supprimé.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition font-medium text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmClear}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition font-medium text-sm"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}