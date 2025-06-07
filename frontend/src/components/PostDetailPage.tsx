'use client'

import "./postDetailPage.css";
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { postService, commentService } from '@/services/api'
import { Post, Comment } from '@/types'
import { User, Calendar, MessageCircle, Send, ThumbsUp, Clock, Eye, ImageIcon, Camera, Trash2 } from 'lucide-react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function PostDetailPage() {
    const [post, setPost] = useState<Post | null>(null)
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [commentLoading, setCommentLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
    const [liked, setLiked] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { data: session } = useSession()
    const params = useParams<{ slug: string }>()
    const router = useRouter()
    const slug = params?.slug ?? '';

    // Check if the image URL is from Pexels
    const isFromPexels = (url: string) => {
        return url && url.includes('images.pexels.com');
    };

    useEffect(() => {
        const fetchPostData = async () => {
            if (!slug) return;

            try {
                setLoading(true)
                const postData = await postService.getPostBySlug(slug)
                setPost(postData)

                // If the user is authenticated, check if they liked the post
                if (session?.accessToken) {
                    const hasLiked = await postService.checkLike(postData._id)
                    setLiked(hasLiked)
                }

                setError(null)
            } catch (err) {
                console.error('Error fetching post:', err)
                setError('Error loading post. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            fetchPostData()
        }
    }, [slug, session])

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newComment.trim() || !session || !post) {
            return
        }

        try {
            setCommentLoading(true)
            const comment = await commentService.createComment(post._id, newComment)

            // Update the post with the new comment
            setPost(prevPost => {
                if (!prevPost) return null;
                return {
                    ...prevPost,
                    comments: [...prevPost.comments, comment]
                }
            })

            setNewComment('')
        } catch (err) {
            console.error('Error creating comment:', err)
            alert('Error creating comment')
        } finally {
            setCommentLoading(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!session || !post) return;

        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            setDeleteLoading(commentId)
            await commentService.deleteComment(post._id, commentId)

            // Update the post by deleting the comment
            setPost(prevPost => {
                if (!prevPost) return null;
                return {
                    ...prevPost,
                    comments: prevPost.comments.filter(comment => comment._id !== commentId)
                }
            })
        } catch (err) {
            console.error('Error deleting comment:', err)
            alert('Error deleting comment')
        } finally {
            setDeleteLoading(null)
        }
    }

    const handleLikeToggle = async () => {
        if (!session || !post) return;

        try {
            setLikeLoading(true)

            if (liked) {
                await postService.unlikePost(post._id)
                setPost(prev => {
                    if (!prev) return null;
                    return { ...prev, likes: prev.likes - 1 }
                })
            } else {
                await postService.likePost(post._id)
                setPost(prev => {
                    if (!prev) return null;
                    return { ...prev, likes: prev.likes + 1 }
                })
            }

            setLiked(!liked)
        } catch (err) {
            console.error('Error managing like:', err)
        } finally {
            setLikeLoading(false)
        }
    }

    // Check if the user can delete a comment (is the author of the comment or post)
    const canDeleteComment = (comment: Comment) => {
        if (!session || !post) return false;

        // Get the current user ID
        const userId = session.user?.userId;

        // We compare the IDs and return true if any match.
        return userId === comment.author.userId || userId === post.author.userId;
    }

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
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

    if (error || !post) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error || 'This post could not be found'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <article className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                {/* Cover Image */}
                {post.coverImage ? (
                    <div className="relative w-full h-96 overflow-hidden">
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 1536px) 100vw, 1536px"
                        />
                        {/*Attribution to Pexels if the image comes from there */}
                        {isFromPexels(post.coverImage) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs">
                                <div className="flex items-center">
                                    <Camera className="w-4 h-4 mr-1" />
                                    <span>Photo provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">Pexels</a></span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

                    <div className="flex items-center mb-6">
                        <div className="flex items-center mr-6 flex-1"> {/* Añadir flex-1 */}
                            {post.author.profilePicture ? (
                                <Image
                                    src={post.author.profilePicture}
                                    alt={post.author.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full mr-2 flex-shrink-0" // flex-shrink-0 para evitar que se comprima
                                />
                            ) : (
                                <User className="w-10 h-10 p-2 bg-gray-200 rounded-full mr-2 text-gray-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0"> {/* flex-1 y min-w-0 para permitir que el texto use el espacio disponible */}
                                <p className="font-medium text-gray-800 truncate">{post.author.name}</p> {/* truncate para cortar texto largo */}
                            </div>
                        </div>

                        <div className="flex flex-wrap text-sm text-gray-600 gap-x-4 gap-y-2">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(post.createdAt)}
                            </span>
                            <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {post.readTime} minutes of reading
                            </span>
                            <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {post.views} views
                            </span>
                        </div>
                    </div>

                    {/* Post content with markdown support */}
                    <div className="prose prose-lg max-w-none mb-6 markdown-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                        <div className="flex items-center">
                            {session ? (
                                <button
                                    onClick={handleLikeToggle}
                                    disabled={likeLoading}
                                    className={`flex items-center space-x-2 ${liked ? 'text-blue-600' : 'text-gray-500'
                                        } hover:text-blue-600 transition disabled:opacity-50`}
                                >
                                    {liked ? <ThumbsUp className="w-5 h-5" /> : <ThumbsUp className="w-5 h-5" />}
                                    <span>{post.likes} Like</span>
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <ThumbsUp className="w-5 h-5" />
                                    <span>{post.likes} Like</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </article>

            {/* Comments section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Comments ({post.comments.length})
                </h2>

                {/* Comment form */}
                {session ? (
                    <form onSubmit={handleSubmitComment} className="mb-8">
                        <div className="flex items-start space-x-4">
                            {session.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Tu foto"
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            ) : (
                                <User className="w-10 h-10 p-2 bg-gray-200 rounded-full text-gray-600" />
                            )}
                            <div className="flex-grow">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Write a comment..."
                                    rows={3}
                                    required
                                ></textarea>
                                <button
                                    type="submit"
                                    disabled={commentLoading || !newComment.trim()}
                                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center disabled:opacity-50"
                                >
                                    {commentLoading ? 'Enviando...' : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Comment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center mb-6">
                        <p>Sign in to comment</p>
                    </div>
                )}

                {/* List of comments */}
                <div className="space-y-6">
                    {post.comments.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">
                            There are no comments yet. Be the first to comment!
                        </p>
                    ) : (
                        post.comments.map((comment) => (
                            <div key={comment._id} className="border-b border-gray-100 pb-6">
                                <div className="flex items-start space-x-3">
                                    {comment.author.profilePicture ? (
                                        <Image
                                            src={comment.author.profilePicture}
                                            alt={comment.author.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 p-2 bg-gray-200 rounded-full text-gray-600" />
                                    )}
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center">
                                                <p className="font-medium text-gray-800 mr-2">{comment.author.name}</p>
                                                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                            </div>

                                            {/* Delete comment button - only visible if the user can delete */}
                                            {canDeleteComment(comment) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    disabled={deleteLoading === comment._id}
                                                    className="text-red-500 hover:text-red-700 transition"
                                                    title="Eliminar comentario"
                                                >
                                                    {deleteLoading === comment._id ? (
                                                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                                                    ) : (
                                                        <Trash2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-700">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}