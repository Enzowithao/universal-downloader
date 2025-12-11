"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History as HistoryIcon, Trash2, Video, AlertTriangle } from "lucide-react";
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
    const handleUpdate = () => loadHistory();
    window.addEventListener("historyUpdated", handleUpdate);

    // Initial load
    // eslint-disable-next-line
    loadHistory();

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
        <div className="w-full max-w-2xl mx-auto mt-12 mb-20">
          <div className="flex items-center justify-between mb-6 px-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <HistoryIcon className="w-5 h-5 text-accent" />
              Historique récent
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs text-muted hover:text-red-400 transition flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded"
              >
                <Trash2 className="w-3 h-3" /> Tout effacer
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {history.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 group hover:border-accent transition-colors shadow-sm cursor-pointer"
                >
                  <div className="relative w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted/20 border border-border">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-1 rounded text-[10px] font-bold text-white">
                      {item.quality}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        {item.date}
                      </span>
                      {item.uploader && (
                        <span className="truncate max-w-[120px]">• {item.uploader}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteItem(e, item.id)}
                    className="p-2 rounded-full bg-muted/10 text-muted hover:bg-red-500 hover:text-white transition flex-shrink-0"
                    title="Retirer de l'historique"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {history.length === 0 && (
              <div className="text-center py-12 text-muted bg-card/30 border border-border rounded-2xl border-dashed">
                <p>Aucun téléchargement récent</p>
              </div>
            )}
          </div>
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