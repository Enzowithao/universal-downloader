import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";

export interface QueueItem {
    id: string;
    title: string;
    progress: number;
    status: 'pending' | 'downloading' | 'processing' | 'finished' | 'error';
    error?: string;
}

interface DownloadQueueProps {
    items: QueueItem[];
    onClear: (id: string) => void;
    withSidebar?: boolean;
}

export default function DownloadQueue({ items, onClear, withSidebar = false }: DownloadQueueProps) {
    if (items.length === 0) return null;

    return (
        <div className={`fixed bottom-20 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none transition-all duration-500 ${withSidebar ? 'right-[360px] md:right-[370px]' : 'right-4'}`}>
            <AnimatePresence mode="popLayout">
                {items.map((item) => (
                    <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 100, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-3 relative overflow-hidden"
                    >
                        {/* Status Indicator Glow */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'finished' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : item.status === 'error' ? 'bg-red-500' : 'bg-purple-500 shadow-[0_0_15px_#a855f7]'}`}></div>

                        <div className="flex items-center justify-between gap-3 pl-2">
                            <div className="flex items-center gap-3 min-w-0">
                                {item.status === 'downloading' || item.status === 'pending' || item.status === 'processing' ? (
                                    <div className="relative">
                                        <div className={`absolute inset-0 rounded-full blur animate-pulse opacity-50 ${item.status === 'processing' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                        <Loader2 className={`w-5 h-5 animate-spin relative z-10 ${item.status === 'processing' ? 'text-blue-400' : 'text-purple-400'}`} />
                                    </div>
                                ) : item.status === 'finished' ? (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring" }}
                                        className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 border border-green-500/30"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="relative"
                                    >
                                        <X className="w-5 h-5 text-red-500 flex-shrink-0 relative z-10" />
                                        <div className="absolute inset-0 bg-red-500/20 blur-md rounded-full"></div>
                                    </motion.div>
                                )}
                                <div className="flex flex-col min-w-0 justify-center gap-0.5 items-start text-left flex-1">
                                    <span className="text-sm font-bold text-white leading-tight break-words w-full">
                                        {item.status === 'finished' ? 'Terminé' :
                                            item.status === 'error' ? 'Erreur' :
                                                item.status === 'processing' ? 'Traitement...' :
                                                    'Téléchargement...'}
                                    </span>
                                    <span className="text-xs text-neutral-300 font-medium truncate w-full opacity-80">
                                        {item.title || "Initialisation..."}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => onClear(item.id)} className="text-neutral-500 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        {(item.status === 'downloading' || item.status === 'pending') && (
                            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden relative ml-2 w-[calc(100%-8px)]">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress}%` }}
                                    transition={{ type: "spring", stiffness: 20, damping: 10 }}
                                >
                                    <div className="w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEgwTDIwIDIwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4yIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3ApIi8+PC9zdmc+')] animate-pulse"></div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}