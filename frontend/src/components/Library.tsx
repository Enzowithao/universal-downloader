import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { formatBytes } from "../lib/utils";
import { Trash2, Download, Film, Music, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface LibraryItem {
    name: string;
    size: number;
    created: number;
    type: 'video' | 'audio' | 'gif';
}

export default function Library() {
    const [files, setFiles] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/library`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            } else {
                toast.error("Impossible de charger la bibliothèque");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const deleteFile = async (name: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce fichier ?")) return;

        try {
            const res = await fetch(`${API_URL}/api/library/${name}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Fichier supprimé");
                setFiles(prev => prev.filter(f => f.name !== name));
            } else {
                toast.error("Erreur suppression");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur connexion");
        }
    };

    const handleDownload = (name: string) => {
        const link = document.createElement('a');
        link.href = `${API_URL}/api/library/stream/${name}`;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 md:p-8 min-h-[60vh]">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <span className="bg-accent/20 p-2 rounded-xl text-accent">📂</span>
                    Médiathèque
                </h2>
                <button
                    onClick={fetchFiles}
                    className="p-2 hover:bg-muted/10 rounded-full transition text-muted hover:text-foreground border border-transparent hover:border-border"
                    title="Actualiser"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && files.length === 0 ? (
                <div className="text-center py-20 text-muted animate-pulse">Chargement de vos fichiers...</div>
            ) : files.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
                    <p className="text-muted mb-2">Aucun fichier téléchargé pour le moment.</p>
                    <p className="text-muted/70 text-sm">Vos téléchargements apparaîtront ici.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {files.map((file) => (
                            <motion.div
                                key={file.name}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-accent transition-all hover:shadow-2xl hover:shadow-accent/10"
                            >
                                <div className="aspect-video bg-black/50 relative flex items-center justify-center overflow-hidden">
                                    {/* Preview */}
                                    {/* Preview */}
                                    {file.type === 'gif' ? (
                                        /* GIF handling with img tag */
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${API_URL}/api/library/stream/${file.name}`}
                                            alt={file.name}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500"
                                        />
                                    ) : file.type === 'video' ? (
                                        /* Video handling with safe play/pause */
                                        <video
                                            src={`${API_URL}/api/library/stream/${file.name}#t=0.01`}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500"
                                            controls={false}
                                            muted
                                            preload="metadata"
                                            onMouseOver={async (e) => {
                                                const v = e.target as HTMLVideoElement;
                                                try {
                                                    await v.play();
                                                } catch (err) {
                                                    // Ignore abort errors caused by fast mouse out
                                                    console.debug("Play aborted", err);
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                const v = e.target as HTMLVideoElement;
                                                v.pause();
                                                v.currentTime = 0;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-background">
                                            <Music className="w-12 h-12 text-muted" />
                                        </div>
                                    )}

                                    {/* Icon Overlay */}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                                        {file.type === 'video' && <Film className="w-3 h-3 text-blue-400" />}
                                        {file.type === 'audio' && <Music className="w-3 h-3 text-purple-400" />}
                                        {file.type === 'gif' && <ImageIcon className="w-3 h-3 text-green-400" />}
                                        {file.type === 'video' ? 'MP4' : file.type === 'audio' ? 'MP3' : 'GIF'}
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="text-foreground font-medium truncate mb-1" title={file.name}>
                                        {file.name}
                                    </h3>
                                    <div className="flex justify-between items-center text-xs text-muted mb-4">
                                        <span>{formatBytes(file.size)}</span>
                                        <span>{new Date(file.created * 1000).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDownload(file.name)}
                                            className="flex-1 bg-muted/10 hover:bg-muted/20 text-foreground border border-border rounded-lg py-2 text-sm font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" /> Récupérer
                                        </button>
                                        <button
                                            onClick={() => deleteFile(file.name)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition border border-transparent hover:border-red-500/20"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
