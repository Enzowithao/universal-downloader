"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Palette, Grid, Sparkles, Activity, LucideIcon, Cloud, Heart } from "lucide-react";
import { ThemeType, useTheme } from "../context/ThemeContext";

interface ThemeSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const themes: { id: ThemeType; label: string; icon: LucideIcon; color: string }[] = [
    { id: 'aurora', label: 'Aurora', icon: Palette, color: 'bg-purple-600' },
    { id: 'particles', label: 'Network', icon: Activity, color: 'bg-blue-600' },
    { id: 'mesh', label: 'Retro Grid', icon: Grid, color: 'bg-pink-600' },
    { id: 'sunset', label: 'Sunset', icon: Sparkles, color: 'bg-orange-500' },
    { id: 'clouds', label: 'Clouds', icon: Cloud, color: 'bg-sky-400' },
    { id: 'candy', label: 'Candy', icon: Heart, color: 'bg-pink-400' },
    { id: 'minimal', label: 'Minimal', icon: Sparkles, color: 'bg-neutral-600' },
];

export default function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
    const { theme, setTheme } = useTheme();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-md h-fit p-6 bg-card border border-border rounded-2xl shadow-2xl z-[70]"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">Personnalisation</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-muted hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`relative group p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 ${theme === t.id
                                        ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(var(--accent),0.2)]'
                                        : 'bg-background border-border hover:border-muted hover:bg-card'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.color} bg-opacity-20 text-foreground shadow-inner`}>
                                        <t.icon className={`w-5 h-5 ${theme === t.id ? 'text-foreground' : 'text-muted group-hover:text-foreground transition'}`} />
                                    </div>
                                    <span className={`text-sm font-medium ${theme === t.id ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>
                                        {t.label}
                                    </span>

                                    {theme === t.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-muted">
                                Le thème choisi est sauvegardé automatiquement.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
