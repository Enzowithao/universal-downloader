export interface VideoFormat {
    id: string;
    height: number;
    label: string;
    ext: string;
    size: string;
}

export interface VideoData {
    title: string;
    uploader: string;
    avatar?: string;
    duration: string;
    thumbnail: string;
    views: number;
    original_url: string;
    playable_url?: string;
    is_vertical?: boolean;
    formats: VideoFormat[];
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