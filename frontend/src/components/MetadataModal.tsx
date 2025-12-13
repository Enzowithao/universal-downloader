import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Music, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MetadataModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        filename: string;
        title?: string;
        artist?: string;
        album?: string;
        cover?: string;
    };
    onSave: (data: any) => Promise<void>;
}

export default function MetadataModal({ isOpen, onClose, file, onSave }: MetadataModalProps) {
    const [title, setTitle] = useState(file.title || file.filename.replace(/\.(mp3|mp4)$/i, ''));
    const [artist, setArtist] = useState(file.artist || '');
    const [album, setAlbum] = useState(file.album || '');
    const [coverUrl, setCoverUrl] = useState(file.cover || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                filename: file.filename,
                title,
                artist,
                album,
                cover_url: coverUrl
            });
            toast.success("Métadonnées mises à jour !");
            onClose();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Music className="w-5 h-5 text-accent" /> Éditeur de Tags
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-full transition">
                                <X className="w-5 h-5 text-muted hover:text-foreground" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-input/50 border border-border rounded-lg px-4 py-2 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
                                    placeholder="Titre de la chanson"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Artiste</label>
                                    <input
                                        type="text"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        className="w-full bg-input/50 border border-border rounded-lg px-4 py-2 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
                                        placeholder="Nom de l'artiste"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted">Album</label>
                                    <input
                                        type="text"
                                        value={album}
                                        onChange={(e) => setAlbum(e.target.value)}
                                        className="w-full bg-input/50 border border-border rounded-lg px-4 py-2 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
                                        placeholder="Nom de l'album"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted">URL de la Pochette</label>
                                <div className="flex gap-3">
                                    <div className="relative w-16 h-16 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden border border-border shrink-0">
                                        {coverUrl ? (
                                            <img src={coverUrl} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '')} />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-muted" />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={coverUrl}
                                        onChange={(e) => setCoverUrl(e.target.value)}
                                        className="w-full bg-input/50 border border-border rounded-lg px-4 py-2 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition h-10 my-auto"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-muted/50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-accent text-white hover:bg-accent/90 transition shadow-lg shadow-accent/20 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>Enregistrement...</>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Sauvegarder
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
