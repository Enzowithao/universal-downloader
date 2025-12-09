"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "../components/SearchBar";
import Features from "../components/Features";
import VideoCard from "../components/VideoCard";
import { toast } from "sonner";
import History from "../components/History";
import Footer from "../components/Footer";

export default function Home() {
  const [status, setStatus] = useState<string>("Connexion...");
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
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
    if(!url) return;
    setLoading(true);
    setVideoData(null);

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/info?url=${encodeURIComponent(url)}`);
        
        if(response.ok) {
            const data = await response.json();
            setVideoData(data);
            toast.success("Vidéo trouvée !");
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

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center pt-32 pb-20 p-6 relative overflow-hidden selection:bg-purple-500/30">
      
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-10 mt-10 md:mt-0">
        
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
            Universal <br/> Downloader.
            </h1>
            {!videoData && (
                <p className="text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
                L'outil ultime pour sauvegarder vos contenus. <br/>
                <span className="text-neutral-500">YouTube • TikTok • Spotify • X</span>
                </p>
            )}
        </div>

        {/* SEARCH BAR */}
        <div className="w-full flex justify-center">
            <div className="w-full max-w-2xl mx-auto">
                <SearchBar onSearch={handleSearch} isLoading={loading} />
            </div>
        </div>

        {/* CONTENU */}
        <div className="w-full min-h-[400px]">
            <AnimatePresence mode="wait">
                {videoData ? (
                    <VideoCard key="result" data={videoData} onReset={() => setVideoData(null)} />
                ) : (
                    !loading && (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Features />
                        </motion.div>
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

        {/* HISTORIQUE */}
        <History onSelect={handleSearch} />

      </div>

      <Footer status={status} />

    </main>
  );
}