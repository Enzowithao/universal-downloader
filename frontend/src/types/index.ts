export interface VideoFormat {
    id: string;
    height: number;
    label: string;
    ext: string;
    size: string;
}

export interface VideoData {
    type: 'video';
    title: string;
    uploader: string;
    avatar?: string;
    duration: string;
    thumbnail: string;
    views: number;
    original_url: string;
    playable_url?: string;
    is_vertical?: boolean;
    orientation?: 'landscape' | 'portrait' | 'square';
    formats: VideoFormat[];
}

export interface PlaylistItem {
    id: string;
    title: string;
    uploader: string;
    duration: string;
    thumbnail: string;
    url: string;
}

export interface PlaylistData {
    type: 'playlist';
    title: string;
    uploader: string;
    thumbnail: string;
    original_url: string;
    entries: PlaylistItem[];
}

export type MediaData = VideoData | PlaylistData;

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