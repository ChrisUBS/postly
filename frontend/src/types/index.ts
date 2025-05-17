// src/types/index.ts

export interface Author {
  userId: string;
  name: string;
  profilePicture?: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: Author;
  slug: string;
  createdAt: string;
  updatedAt: string;
  status: "published" | "draft";
  readTime: number;
  views: number;
  likes: number;
  comments: Comment[];
  coverImage?: string; // Opcional porque algunos posts podrían no tener imagen
}

export interface User {
  userId: string;
  name: string;
  email?: string;
  profilePicture?: string;
  lastLogin?: string;
}

export interface PaginatedResponse<T> {
  posts: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}