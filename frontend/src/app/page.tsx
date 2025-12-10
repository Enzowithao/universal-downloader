"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "../components/SearchBar";
import Features from "../components/Features";
import VideoCard from "../components/VideoCard";
import { toast } from "sonner";
import History from "../components/History";
import { API_URL } from "../config";

import Footer from "../components/Footer";
import { MediaData } from "../types";
import PlaylistSidebar from "../components/PlaylistSidebar";
import DownloadQueue, { QueueItem } from "../components/DownloadQueue";
import BackgroundElements from "../components/BackgroundElements";

export default function Home() {
    const [status, setStatus] = useState<string>("Connexion...");
    const [videoData, setVideoData] = useState<MediaData | null>(null);
    const [loading, setLoading] = useState(false);

    // Batch Download State
    const [batchUrls, setBatchUrls] = useState<string[]>([]);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

    // Confetti Effect if all finished
    useEffect(() => {
        if (queueItems.length > 0) {
            const allFinished = queueItems.every(i => i.status === 'finished');
            if (allFinished) {
                import('canvas-confetti').then((confetti) => {
                    confetti.default({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#a855f7', '#d8b4fe', '#ffffff'] // Purple Theme
                    });
                });
            }
        }
    }, [queueItems]);

    useEffect(() => {
        fetch(`${API_URL}/`)
            .then((res) => res.json())
            .then(() => setStatus("Système opérationnel 🟢"))
            .catch(() => setStatus("Backend déconnecté 🔴"));
    }, []);

    // --- GESTION DU RACCOURCI ECHAP ---
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                // Si une vidéo est affichée, on la ferme
                if (videoData) {
                    setVideoData(null);
                    toast.info("Retour à l'accueil");
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [videoData]); // On dépend de videoData pour savoir si on doit agir

    const handleSearch = async (url: string) => {
        if (!url) return;
        setLoading(true);
        setVideoData(null);

        try {
            const response = await fetch(`${API_URL}/api/info?url=${encodeURIComponent(url)}`);

            if (response.ok) {
                const data = await response.json();
                setVideoData(data);
                toast.success(data.type === 'playlist' ? "Playlist chargée !" : "Vidéo trouvée !");
            } else {
                const errorData = await response.json();
                toast.error(errorData.detail || "Impossible de récupérer la vidéo.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    const launchBatch = async (formatId: string) => {
        setShowBatchModal(false);
        toast.info(`Lancement de ${batchUrls.length} téléchargements...`);

        for (const url of batchUrls) {
            try {
                await new Promise(r => setTimeout(r, 500));

                // Temporary queue item
                const tempId = Math.random().toString(36).substr(2, 9);
                setQueueItems(prev => [...prev, {
                    id: tempId,
                    title: "Préparation...",
                    progress: 0,
                    status: 'pending'
                }]);

                const prepareUrl = `${API_URL}/api/prepare?url=${encodeURIComponent(url)}&format_id=${encodeURIComponent(formatId)}&title=&start=0&end=0`;
                const res = await fetch(prepareUrl, { method: 'POST' });

                if (res.ok) {
                    const { task_id } = await res.json();
                    // Update temp item with real task_id
                    setQueueItems(prev => prev.map(item => item.id === tempId ? { ...item, id: task_id, status: 'downloading' } : item));
                    monitorBatchDownload(task_id);
                } else {
                    setQueueItems(prev => prev.filter(item => item.id !== tempId));
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const monitorBatchDownload = (taskId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/progress/${taskId}`);
                if (res.ok) {
                    const task = await res.json();

                    setQueueItems(prev => prev.map(item => {
                        if (item.id !== taskId) return item;
                        return {
                            ...item,
                            title: task.title || item.title,
                            progress: task.progress || 0,
                            status: task.status === 'finished' ? 'finished' : task.status === 'error' ? 'error' : 'downloading',
                            error: task.error
                        };
                    }));

                    if (task.status === 'finished') {
                        clearInterval(interval);
                        const link = document.createElement('a');
                        link.href = `${API_URL}/api/download/${taskId}`;
                        link.setAttribute('download', '');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success(`Terminé: ${task.title}`);

                        // Auto clear after 5s
                        setTimeout(() => {
                            setQueueItems(prev => prev.filter(p => p.id !== taskId));
                        }, 5000);
                    } else if (task.status === 'error') {
                        clearInterval(interval);
                    }
                }
            } catch {
                clearInterval(interval);
            }
        }, 1000);
    };

    return (
        <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center pt-32 pb-20 p-6 relative overflow-hidden selection:bg-purple-500/30">

            {/* New Animated Background */}
            <BackgroundElements />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-10 mt-10 md:mt-0">

                {/* EN-TÊTE */}
                <div className="space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-20 h-20 group">
                            <div className="absolute inset-0 bg-purple-600 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
                            {/* On utilise le logo si tu l'as mis, sinon assure-toi que le fichier existe */}
                            <img
                                src="/logo.svg"
                                alt="Logo"
                                className="relative w-full h-full shadow-2xl rounded-[2rem] transform group-hover:scale-105 transition duration-500"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
                        Universal <br /> Downloader.
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
                        L&apos;outil ultime pour sauvegarder vos contenus. <br />
                        <span className="text-neutral-500 text-sm mt-2 block">YouTube • TikTok • Instagram • X</span>
                    </p>
                </div>

                {/* SEARCH BAR */}
                <div className="w-full flex justify-center">
                    <div className="w-full max-w-2xl mx-auto">
                        <SearchBar onSearch={handleSearch} isLoading={loading} />
                    </div>
                </div>

                {/* CONTENU */}
                <div className="w-full transition-all duration-500">
                    <AnimatePresence mode="wait">
                        {videoData?.type === 'video' ? (
                            <div className="mt-8">
                                <VideoCard key="result" data={videoData} onReset={() => setVideoData(null)} />
                            </div>
                        ) : videoData?.type === 'playlist' ? (
                            <div className="flex flex-col items-center mt-12">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-4 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 backdrop-blur-sm"
                                >
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Playlist Détectée !</h2>
                                    <p className="text-neutral-400 max-w-sm">
                                        Sélectionnez plusieurs vidéos dans le menu de droite pour lancer un téléchargement groupé.
                                    </p>
                                </motion.div>
                            </div>
                        ) : (
                            !loading && (
                                <div className="mt-20">
                                    <motion.div
                                        key="features"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <Features />
                                    </motion.div>
                                </div>
                            )
                        )}

                        {loading && (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-20 flex flex-col items-center"
                            >
                                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-neutral-500 text-sm animate-pulse">Analyse du lien en cours...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <History onSelect={handleSearch} />

                {/* DOWNLOAD QUEUE POPUP */}
                <DownloadQueue
                    items={queueItems}
                    onClear={(id) => setQueueItems(prev => prev.filter(p => p.id !== id))}
                    withSidebar={videoData?.type === 'playlist'}
                />

            </div>

            <Footer status={status} />

            {/* SIDEBAR PLAYLIST */}
            <AnimatePresence>
                {videoData?.type === 'playlist' && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 20 }}
                        className="fixed top-0 right-0 h-full z-50 pointer-events-auto"
                    >
                        <PlaylistSidebar
                            entries={videoData.entries}
                            onSelectVideo={(url) => handleSearch(url)}
                            onBatchDownload={(urls) => {
                                setBatchUrls(urls);
                                setShowBatchModal(true);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL BATCH DOWNLOAD */}
            <AnimatePresence>
                {showBatchModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2">Téléchargement Groupé</h3>
                            <p className="text-neutral-400 text-sm mb-6">Vous allez télécharger {batchUrls.length} vidéos. Choisissez la qualité :</p>

                            <div className="space-y-3">
                                <button onClick={() => launchBatch("bestvideo+bestaudio/best")} className="w-full p-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-between group transition">
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-white">Vidéo (Max)</span>
                                        <span className="text-xs text-neutral-500">MP4 • Meilleure qualité dispo</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border border-neutral-500 group-hover:border-purple-500"></div>
                                </button>

                                <button onClick={() => launchBatch("bestaudio/best")} className="w-full p-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-between group transition">
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-white">Audio Uniquement</span>
                                        <span className="text-xs text-neutral-500">MP3 • 192kbps estimé</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border border-neutral-500 group-hover:border-purple-500"></div>
                                </button>
                            </div>

                            <button onClick={() => setShowBatchModal(false)} className="mt-6 w-full py-2 text-neutral-500 hover:text-white text-sm">Annuler</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
