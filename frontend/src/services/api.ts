// src/services/api.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';
import { Post, Comment, PaginatedResponse, User } from '@/types';

// Crear instancia de axios con URL base
const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
	headers: {
		'Content-Type': 'application/json',
	}
});

// Interceptor para añadir token de autenticación a cada petición
api.interceptors.request.use(async (config) => {
	const session = await getSession();
	if (session?.accessToken) {
		config.headers.Authorization = `Bearer ${session.accessToken}`;
	}
	return config;
});

// Servicio para autenticación
export const authService = {
	// Verificar estado de autenticación
	checkAuth: async (): Promise<User> => {
		const response = await api.get('/auth/check');
		return response.data;
	},

	// Iniciar sesión con Google
	loginWithGoogle: async (token: string) => {
		const response = await api.post('/auth/login', { token });
		return response.data;
	}
};

// Interfaces para la creación y actualización de posts
interface CreatePostData {
	title: string;
	content: string;
	status?: string;
	coverImage?: string; // URL de la imagen de Pexels
}

interface UpdatePostData {
	title?: string;
	content?: string;
	status?: string;
	coverImage?: string | null; // URL de la imagen de Pexels o null para quitar la imagen
}

// Servicio para posts
export const postService = {
	// Obtener todos los posts
	getAllPosts: async (page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
		const response = await api.get(`/posts?page=${page}&limit=${limit}`);
		return response.data;
	},

	// Obtener un post por ID
	getPostById: async (id: string): Promise<Post> => {
		const response = await api.get(`/posts/${id}`);
		return response.data;
	},

	// Obtener un post por slug
	getPostBySlug: async (slug: string): Promise<Post> => {
		const response = await api.get(`/posts/slug/${slug}`);
		return response.data;
	},

	// Crear un nuevo post con imagen de portada
	createPost: async (data: CreatePostData): Promise<Post> => {
		const response = await api.post('/posts', data);
		return response.data;
	},

	// Actualizar un post con imagen de portada
	updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
		const response = await api.put(`/posts/${id}`, data);
		return response.data;
	},

	// Eliminar un post
	deletePost: async (id: string): Promise<void> => {
		await api.delete(`/posts/${id}`);
	},

	// Búsqueda de posts
	searchPosts: async (query: string): Promise<Post[]> => {
		const response = await api.get(`/posts/search?q=${encodeURIComponent(query)}`);
		return response.data;
	},

	// Dar like a un post
	likePost: async (postId: string): Promise<void> => {
		await api.post(`/posts/${postId}/like`);
	},

	// Quitar like de un post
	unlikePost: async (postId: string): Promise<void> => {
		await api.delete(`/posts/${postId}/like`);
	},

	// Verificar si un post tiene like del usuario
	checkLike: async (postId: string): Promise<boolean> => {
		const response = await api.get(`/posts/${postId}/like`);
		return response.data.liked;
	},

	// Obtener mis posts (incluyendo borradores)
	getMyPosts: async (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Post>> => {
		let url = `/users/me/posts?page=${page}&limit=${limit}`;
		if (status) url += `&status=${status}`;
		const response = await api.get(url);
		return response.data;
	},

	// Obtener posts de un usuario
	getUserPosts: async (userId: string, page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
		const response = await api.get(`/users/${userId}/posts?page=${page}&limit=${limit}`);
		return response.data;
	}
};

// Servicio para Pexels
export const pexelsService = {
	// Buscar imágenes en Pexels
	searchImages: async (query: string, page = 1, perPage = 10): Promise<any> => {
		const response = await fetch(`/api/pexels/search?query=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}`);

		if (!response.ok) {
			throw new Error('Error al buscar imágenes en Pexels');
		}

		return response.json();
	},

	// Obtener imágenes curadas de Pexels
	getCuratedImages: async (page = 1, perPage = 10): Promise<any> => {
		const response = await fetch(`/api/pexels/curated?page=${page}&perPage=${perPage}`);

		if (!response.ok) {
			throw new Error('Error al obtener imágenes curadas de Pexels');
		}

		return response.json();
	}
};

// Servicio para comentarios
export const commentService = {
	// Obtener comentarios de un post
	getCommentsByPostId: async (postId: string): Promise<Comment[]> => {
		const response = await api.get(`/posts/${postId}/comments`);
		return response.data;
	},

	// Crear un comentario en un post
	createComment: async (postId: string, content: string): Promise<Comment> => {
		const response = await api.post(`/posts/${postId}/comments`, { content });
		return response.data;
	},

	// Eliminar un comentario
	deleteComment: async (postId: string, commentId: string): Promise<void> => {
		await api.delete(`/posts/${postId}/comments/${commentId}`);
	}
};

export default api;