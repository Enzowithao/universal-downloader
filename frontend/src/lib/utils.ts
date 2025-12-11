import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- 1. FONCTION DESIGN (Indispensable pour GlareCard) ---
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- 2. FONCTIONS VIDÉO & TRIMMING ---

export const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
};

export const secondsToTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const calculateCutSize = (originalSize: string, totalDuration: number, newDuration: number): string => {
    if (!originalSize || originalSize.includes("N/A") || totalDuration === 0) return originalSize;
    if (newDuration >= totalDuration - 1) return originalSize;

    const value = parseFloat(originalSize.replace(/[^0-9.]/g, ''));
    if (isNaN(value)) return originalSize;

    const ratio = newDuration / totalDuration;
    const newSize = value * ratio;

    const unit = originalSize.replace(/[0-9.]/g, '').trim();
    return `~${newSize.toFixed(1)} ${unit}`;
};

// --- 3. DÉTECTION DE PLATEFORME ---
export const getPlatformLogo = (url: string | undefined): string | null => {
    if (!url) return null;

    const urlLower = url.toLowerCase();

    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        return '/Logos/Youtube_logo.png';
    }
    if (urlLower.includes('tiktok.com')) {
        return '/Logos/tiktok.png';
    }
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        return '/Logos/X-Logo.png';
    }


    return null;
};