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
// New Import
import Library from "../components/Library";
import { LayoutGrid, Download as DownloadIcon, Palette } from "lucide-react";
import { ThemeProvider } from "../context/ThemeContext";
import ThemeSettings from "../components/ThemeSettings";

export default function Home() {
    const [status, setStatus] = useState<string>("Connexion...");
    const [videoData, setVideoData] = useState<MediaData | null>(null);
    const [loading, setLoading] = useState(false);

    // View State
    const [view, setView] = useState<'home' | 'library'>('home');

    // Batch Download State
    const [batchUrls, setBatchUrls] = useState<string[]>([]);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

    // Theme Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        setView('home'); // Force return to home on search

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
                        // Auto-download only if not in library mode workflow (batch is usually auto)
                        // But wait, the user might want them in the library now.
                        // Let's keep the auto download blob for convenience for now.

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
        <ThemeProvider>
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center pt-10 pb-20 p-6 relative overflow-hidden transition-colors duration-500">

                <ThemeSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

                {/* New Animated Background */}
                <BackgroundElements />

                {/* Content Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }}
                    className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center mt-10 md:mt-0"
                >

                    {/* NAVIGATION HEADER */}
                    <motion.nav
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 20 }}
                        className="fixed top-6 z-50 bg-card/50 backdrop-blur-md rounded-full p-1.5 border border-border shadow-2xl flex gap-1"
                    >
                        <button
                            onClick={() => setView('home')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${view === 'home' ? 'bg-card border border-border text-foreground shadow-lg' : 'text-muted hover:text-foreground'}`}
                        >
                            <DownloadIcon className="w-4 h-4" /> Accueil
                        </button>
                        <button
                            onClick={() => setView('library')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${view === 'library' ? 'bg-card border border-border text-foreground shadow-lg' : 'text-muted hover:text-foreground'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Médiathèque
                        </button>
                        <div className="w-px h-6 bg-border mx-1 self-center"></div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-full text-muted hover:text-foreground hover:bg-white/10 transition-all"
                            title="Personnaliser"
                        >
                            <Palette className="w-4 h-4" />
                        </button>
                    </motion.nav>

                    {/* VIEW SWITCHER */}
                    {view === 'library' ? (
                        <div className="w-full mt-24">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                                <Library />
                            </motion.div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center space-y-10 mt-24">
                            {/* EN-TÊTE */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="relative w-20 h-20 group">
                                        <div className="absolute inset-0 bg-accent rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
                                        <img
                                            src="/logo.svg"
                                            alt="Logo"
                                            className="relative w-full h-full shadow-2xl rounded-[2rem] transform group-hover:scale-105 transition duration-500"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted">
                                    Universal <br /> Downloader.
                                </h1>
                                <p className="text-muted text-lg max-w-md mx-auto leading-relaxed">
                                    L&apos;outil ultime pour sauvegarder vos contenus. <br />
                                    <span className="text-muted/80 text-sm mt-2 block">YouTube • TikTok • Instagram • X</span>
                                </p>
                            </motion.div>

                            {/* SEARCH BAR */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="w-full flex justify-center"
                            >
                                <div className="w-full max-w-2xl mx-auto">
                                    <SearchBar onSearchStart={handleSearch} isLoading={loading} />
                                </div>
                            </motion.div>

                            {/* CONTENU */}
                            <div className="w-full transition-all duration-500">
                                <AnimatePresence mode="wait">
                                    {videoData?.type === 'video' ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -50 }}
                                            className="mt-8"
                                        >
                                            <VideoCard key="result" data={videoData} onReset={() => setVideoData(null)} />
                                        </motion.div>
                                    ) : videoData?.type === 'playlist' ? (
                                        <div className="flex flex-col items-center mt-12">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-center space-y-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-sm"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                                </div>
                                                <h2 className="text-2xl font-bold text-foreground">Playlist Détectée !</h2>
                                                <p className="text-muted max-w-sm">
                                                    Sélectionnez plusieurs vidéos dans le menu de droite pour lancer un téléchargement groupé.
                                                </p>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        !loading && (
                                            <div className="mt-20">
                                                <motion.div
                                                    key="features"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: 0.8 }}
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
                                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                                            <p className="mt-4 text-muted text-sm animate-pulse">Analyse du lien en cours...</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    <History onSelect={handleSearch} />

                    {/* DOWNLOAD QUEUE POPUP */}
                    <DownloadQueue
                        items={queueItems}
                        onClear={(id) => setQueueItems(prev => prev.filter(p => p.id !== id))}
                        withSidebar={videoData?.type === 'playlist'}
                    />

                </motion.div>

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
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                                <h3 className="text-xl font-bold text-foreground mb-2">Téléchargement Groupé</h3>
                                <p className="text-muted text-sm mb-6">Vous allez télécharger {batchUrls.length} vidéos. Choisissez la qualité :</p>

                                <div className="space-y-3">
                                    <button onClick={() => launchBatch("bestvideo+bestaudio/best")} className="w-full p-4 rounded-xl bg-background hover:bg-card border border-border flex items-center justify-between group transition">
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-foreground">Vidéo (Max)</span>
                                            <span className="text-xs text-muted">MP4 • Meilleure qualité dispo</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border border-muted group-hover:border-accent"></div>
                                    </button>

                                    <button onClick={() => launchBatch("bestaudio/best")} className="w-full p-4 rounded-xl bg-background hover:bg-card border border-border flex items-center justify-between group transition">
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-foreground">Audio Uniquement</span>
                                            <span className="text-xs text-muted">MP3 • 192kbps estimé</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border border-muted group-hover:border-accent"></div>
                                    </button>
                                </div>

                                <button onClick={() => setShowBatchModal(false)} className="mt-6 w-full py-2 text-muted hover:text-foreground text-sm">Annuler</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </ThemeProvider>
    );
}
