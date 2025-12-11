import { PlaylistItem } from "../types";
import { Check, Download, Square, CheckSquare } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PlaylistSidebarProps {
    entries: PlaylistItem[];
    onBatchDownload: (selectedUrls: string[]) => void;
}

export default function PlaylistSidebar({ entries, onBatchDownload }: PlaylistSidebarProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const selectAll = () => {
        if (selectedIds.length === entries.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(entries.map(e => e.id || e.url));
        }
    };

    const handleBatchClick = () => {
        // Find URLs corresponding to selected IDs
        const urls = entries
            .filter(e => selectedIds.includes(e.id || e.url))
            .map(e => e.url);
        onBatchDownload(urls);
    };

    return (
        <div className="w-full md:w-[350px] bg-neutral-900/90 border-l border-neutral-800 h-[calc(100vh)] overflow-hidden flex flex-col md:fixed md:right-0 md:top-0 z-40 backdrop-blur-xl shadow-2xl">

            {/* HEADER */}
            <div className="p-4 border-b border-neutral-800 bg-black/40 pt-24 md:pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <span className="bg-purple-600 px-2 py-0.5 rounded text-xs">PLAYLIST</span>
                        <span className="opacity-60 text-sm">{entries.length} vidéos</span>
                    </h3>
                    <button
                        onClick={selectAll}
                        className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1"
                    >
                        {selectedIds.length === entries.length ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                        Tout
                    </button>
                </div>
            </div>

            {/* LIST */}
            <motion.div
                className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                    hidden: {}
                }}
                initial="hidden"
                animate="visible"
            >
                {entries.map((video, index) => {
                    const isSelected = selectedIds.includes(video.id || video.url);
                    return (
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, x: 20 },
                                visible: { opacity: 1, x: 0 }
                            }}
                            key={video.id || index}
                            className={`group flex gap-3 p-2 rounded-xl transition cursor-pointer border ${isSelected ? 'bg-purple-500/10 border-purple-500/50' : 'bg-transparent border-transparent hover:bg-neutral-800/50'}`}
                            onClick={(e) => toggleSelection(e, video.id || video.url)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Checkbox */}
                            <div className="flex items-center justify-center">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-neutral-600 group-hover:border-neutral-400'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </div>

                            {/* Thumbnail */}
                            <div className="relative w-20 h-12 bg-black flex-shrink-0 rounded-md overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                <h4 className={`text-xs font-medium line-clamp-2 leading-snug ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{video.title}</h4>
                                <span className="text-[10px] text-neutral-500 mt-0.5">{video.duration}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur">
                <AnimatePresence mode="wait">
                    {selectedIds.length > 0 ? (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={handleBatchClick}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Télécharger ({selectedIds.length})
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-xs text-neutral-500 py-2"
                        >
                            Sélectionnez des vidéos pour télécharger
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
