// src/types/pexels.ts
export interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: string; // String en lugar de number
    avg_color: string | null; // Puede ser null
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    liked: boolean;
    alt: string | null; // Puede ser null
}

export interface PexelsPhotoResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    total_results: number;
    next_page: string | number | null; // Puede ser string, number o null
    prev_page: string | number | null; // Puede ser string, number o null
}