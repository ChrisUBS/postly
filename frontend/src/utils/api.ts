import axios from 'axios'
import { getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
})

// Interceptor para añadir token de autenticación
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

export const postService = {
  getPosts: () => api.get('/posts'),
  getPostById: (id: string) => api.get(`/posts/${id}`),
  createPost: (data: { title: string; content: string; status?: string }) => api.post('/posts', data),
}

export const commentService = {
  createComment: (postId: string, data: any) => api.post(`/posts/${postId}/comments`, data),
}

export default api