'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { postService } from '@/services/api'
import { Post } from '@/types'
import { MessageCircle, ThumbsUp, Calendar, User, Clock, Camera } from 'lucide-react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const router = useRouter()

    const isFromPexels = (url: string) => {
        return url && url.includes('images.pexels.com');
    };

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true)
                const response = await postService.getAllPosts(currentPage, 10)
                setPosts(response.posts)
                setTotalPages(response.pagination.totalPages)
                setError(null)
            } catch (err) {
                console.error('Error fetching posts:', err)
                setError('Fail to load the posts. Try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchPosts()
    }, [currentPage])

    const handlePostClick = (slug: string) => {
        router.push(`/posts/${slug}`)
    }

    // Formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Recent Posts</h1>
                <p className="text-xl text-gray-600">Explore the most interesting conversations on Postly</p>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-2xl text-gray-500">There are no posts yet.</p>
                    <p className="text-gray-500">Be the first to share your ideas!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <div
                            key={post._id}
                            onClick={() => handlePostClick(post.slug)}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col h-full"
                        >
                            {/* Cover Image or Placeholder para mantener altura consistente */}
                            {post.coverImage ? (
                                <div className="relative w-full h-48 overflow-hidden">
                                    <Image
                                        src={post.coverImage}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover"
                                    />
                                    {isFromPexels(post.coverImage) && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-1 text-xs">
                                            <div className="flex items-center justify-center">
                                                <Camera className="w-3 h-3 mr-1" />
                                                <span>Pexels</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 pt-4">
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h2>
                                    <div className="text-gray-600 mb-4 line-clamp-9">
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ children }) => <span>{children}</span>
                                            }}
                                        >
                                            {post.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Content only if there is an image, since without an image the content is at the top */}
                            {post.coverImage && (
                                <div className="p-6 flex-grow">
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h2>
                                    <div className="text-gray-600 mb-4 line-clamp-3">
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ children }) => <span>{children}</span>
                                            }}
                                        >
                                            {post.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Footer with metadata */}
                            <div className="px-6 pb-4 mt-auto border-t border-gray-100 pt-3">
                                {/* Date and time of reading */}
                                <div className="flex items-center space-x-4 text-gray-500 text-sm mb-2">
                                    <span className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {formatDate(post.createdAt)}
                                    </span>
                                    <span className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {post.readTime} min
                                    </span>
                                </div>

                                {/* Author and statistics */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        {post.author.profilePicture ? (
                                            <Image
                                                src={post.author.profilePicture}
                                                alt={post.author.name}
                                                width={24}
                                                height={24}
                                                className="rounded-full mr-2"
                                            />
                                        ) : (
                                            <User className="w-5 h-5 mr-2 text-gray-500" />
                                        )}
                                        <span className="text-sm text-gray-700">{post.author.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="flex items-center text-gray-500 text-sm">
                                            <ThumbsUp className="w-4 h-4 mr-1" />
                                            {post.likes}
                                        </span>
                                        <span className="flex items-center text-gray-500 text-sm">
                                            <MessageCircle className="w-4 h-4 mr-1" />
                                            {post.comments?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-12 space-x-4">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                        Previous
                    </button>
                    <span className="flex items-center">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}