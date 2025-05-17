// src/services/pexelsService.ts
import { createClient, PhotosWithTotalResults, Photo, ErrorResponse } from 'pexels';
import { PexelsPhotoResponse, PexelsPhoto } from '../types/pexels';

// Configura el cliente con tu API key
const pexelsClient = createClient(process.env.NEXT_PUBLIC_PEXELS_API_KEY || '');

export const searchPhotos = async (
    query: string,
    page: number = 1,
    perPage: number = 10
): Promise<PexelsPhotoResponse> => {
    try {
        const response = await pexelsClient.photos.search({
            query,
            page,
            per_page: perPage
        }) as PhotosWithTotalResults;

        // Convertir correctamente cada foto al tipo PexelsPhoto
        const mappedPhotos: PexelsPhoto[] = response.photos.map(photo => ({
            ...photo,
            photographer_id: String(photo.photographer_id) // Asegurar que sea string
        }));

        return {
            page: page,
            per_page: perPage,
            photos: mappedPhotos,
            total_results: response.total_results,
            next_page: response.next_page, // Ya no necesitamos la conversión a string
            prev_page: null // La API de Pexels no proporciona prev_page
        };
    } catch (error) {
        console.error('Error al buscar fotos en Pexels:', error);
        throw error;
    }
};

export const getCuratedPhotos = async (
    page: number = 1,
    perPage: number = 10
): Promise<PexelsPhotoResponse> => {
    try {
        const response = await pexelsClient.photos.curated({
            page,
            per_page: perPage
        }) as PhotosWithTotalResults;

        // Convertir correctamente cada foto al tipo PexelsPhoto
        const mappedPhotos: PexelsPhoto[] = response.photos.map(photo => ({
            ...photo,
            photographer_id: String(photo.photographer_id) // Asegurar que sea string
        }));

        return {
            page: page,
            per_page: perPage,
            photos: mappedPhotos,
            total_results: response.total_results,
            next_page: response.next_page, // Ya no necesitamos la conversión a string
            prev_page: null // La API de Pexels no proporciona prev_page
        };
    } catch (error) {
        console.error('Error al obtener fotos curadas de Pexels:', error);
        throw error;
    }
};

export const getPhotoById = async (id: number): Promise<PexelsPhoto> => {
    try {
        const response = await pexelsClient.photos.show({ id });

        // Verificar si es un error o una foto válida
        if ('error' in response) {
            throw new Error((response as ErrorResponse).error);
        }

        // Ahora sabemos que es una foto
        const photo = response as Photo;

        // Convertir el resultado al tipo PexelsPhoto
        return {
            ...photo,
            photographer_id: String(photo.photographer_id),
            alt: photo.alt || null,
            avg_color: photo.avg_color || null
        } as unknown as PexelsPhoto;
    } catch (error) {
        console.error(`Error al obtener la foto con ID ${id} de Pexels:`, error);
        throw error;
    }
};