'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { postService } from '@/services/api'
import { PenTool, Save, AlignLeft, Clock, ImageIcon, X } from 'lucide-react'
import Image from 'next/image'

// Pexels configuration
const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY
const PEXELS_API_URL = 'https://api.pexels.com/v1/search'

interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: string;
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
    alt: string | null; // It can be null
}

export default function CreatePostPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [status, setStatus] = useState('published')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // States for Pexels images
    const [recommendedImages, setRecommendedImages] = useState<PexelsPhoto[]>([])
    const [selectedImage, setSelectedImage] = useState<PexelsPhoto | null>(null)
    const [imageLoading, setImageLoading] = useState(false)

    const router = useRouter()
    const { data: session, status: sessionStatus } = useSession()

    // Calculate approximate reading time
    const calculateReadTime = (text: string) => {
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.round(words / 200)); // 200 words per minute
    };

    // Function to search for images in Pexels
    const fetchPexelsImages = async (query: string) => {
        if (!query.trim() || !PEXELS_API_KEY) return;

        setImageLoading(true)
        try {
            const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=6`, {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            });

            const data = await response.json()
            setRecommendedImages(data.photos || [])
        } catch (err) {
            console.error('Error fetching Pexels images:', err)
        } finally {
            setImageLoading(false)
        }
    }

    // Redirect if it is not authenticated
    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push('/')
        }
    }, [sessionStatus, router])

    // Effect to search for images when the title changes
    useEffect(() => {
        if (title.trim()) {
            // We implement a debate not to make many requests
            const debounceTimer = setTimeout(() => {
                fetchPexelsImages(title)
            }, 500)

            return () => clearTimeout(debounceTimer)
        }
    }, [title])

    // Function to remove the selected image
    const handleRemoveImage = () => {
        setSelectedImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim() || !content.trim()) {
            setError('Title and content are required')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const newPost = await postService.createPost({
                title: title.trim(),
                content: content.trim(),
                status,
                // We use the selected Pexels image URL
                coverImage: selectedImage?.src.large
            })

            // Redirect the new post page
            router.push(`/posts/${newPost.slug}`)
        } catch (err) {
            console.error('Error creating post:', err)
            setError('Error when creating the post.Try it again.')
        } finally {
            setLoading(false)
        }
    }

    // Conditional rendering after declaring all hooks
    if (sessionStatus === 'loading') {
        return <div className="container mx-auto px-4 py-16 max-w-3xl">Loading...</div>
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                        <PenTool className="w-8 h-8 mr-2 text-blue-600" />
                        Create new publication
                    </h1>
                    <p className="text-gray-600">Share your ideas with the Postly community</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Write an attractive title..."
                            required
                        />
                    </div>

                    {/* Recommended Image Section */}
                    <div className="mb-6">
                        <div className="flex items-center mb-2 justify-between">
                            <div className="flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                                <h3 className="text-gray-700 font-medium">Cover image (optional)</h3>
                            </div>
                        </div>

                        {/* Show the selected image */}
                        {selectedImage && (
                            <div className="mb-4 relative">
                                <div className="relative h-48 rounded-lg overflow-hidden">
                                    <Image
                                        src={selectedImage.src.large}
                                        alt={selectedImage.alt || `Photo by ${selectedImage.photographer}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 768px"
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        aria-label="Remove image"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    Photo by <a
                                        href={selectedImage.photographer_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {selectedImage.photographer}
                                    </a> in Pexels
                                </div>
                            </div>
                        )}

                        {title.trim() && (
                            <div className="mb-6">
                                <div className="flex items-center mb-2">
                                    <h3 className="text-sm text-gray-700">Suggested images (Pexels)</h3>
                                </div>

                                {imageLoading ? (
                                    <div className="flex justify-center items-center p-4">
                                        <span>Loading images...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-4">
                                            {recommendedImages.map((image) => (
                                                <div
                                                    key={image.id}
                                                    onClick={() => setSelectedImage(image)}
                                                    className={`cursor-pointer rounded-lg overflow-hidden border-2 hover:border-blue-500 transition ${selectedImage?.id === image.id
                                                        ? 'border-blue-600'
                                                        : 'border-transparent'
                                                        }`}
                                                >
                                                    <div className="relative h-36 w-full">
                                                        <Image
                                                            src={image.src.medium}
                                                            alt={image.alt || `Foto por ${image.photographer}`}
                                                            fill
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="p-2 text-xs text-center truncate">
                                                        By: {image.photographer}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {recommendedImages.length === 0 && !imageLoading && (
                                            <div className="text-center p-4 bg-gray-50 rounded my-2">
                                                No images were found to "{title}". Try with other keywords.
                                            </div>
                                        )}

                                        <div className="text-xs text-right mt-2 text-gray-500">
                                            Images provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Pexels</a>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                            Content
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Write the content of your publication..."
                            rows={12}
                            required
                        />
                    </div>

                    {/* Additional information */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-gray-700">
                                <AlignLeft className="w-5 h-5" />
                                <span>Words: {content.trim().split(/\s+/).length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-700">
                                <Clock className="w-5 h-5" />
                                <span>Reading time: ~{calculateReadTime(content)} min</span>
                            </div>
                        </div>
                    </div>

                    {/* Post status */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Status
                        </label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="status"
                                    value="published"
                                    checked={status === 'published'}
                                    onChange={() => setStatus('published')}
                                />
                                <span className="ml-2">Post</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="status"
                                    value="draft"
                                    checked={status === 'draft'}
                                    onChange={() => setStatus('draft')}
                                />
                                <span className="ml-2">Save as draft</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="mr-4 bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition flex items-center disabled:opacity-70"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    {status === 'published' ? 'Post' : 'Save draft'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}