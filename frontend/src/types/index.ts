export interface DownloadOption {
    type: string;
    quality: string;
    ext: string;
    size: string;
}

export interface VideoData {
    title: string;
    thumbnail: string;
    uploader: string;
    avatar?: string | null;
    duration: string;
    views?: number;
    original_url?: string;
    playable_url?: string; // URL directe pour le player
    is_vertical?: boolean; // <--- CETTE LIGNE EST INDISPENSABLE
    options: DownloadOption[];
}

export interface HistoryItem {
    id: number;
    title: string;
    thumbnail: string;
    uploader: string;
    url: string;
    type: string;
    quality: string;
    date: string;
}