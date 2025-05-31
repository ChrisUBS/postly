'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { postService } from '@/services/api'
import { Post } from '@/types'
import Image from 'next/image'
import { User, PenTool, FileText, Edit, Trash2 } from 'lucide-react'

export default function ProfilePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    // Redirect if it is not authenticated
    if (status === 'unauthenticated') {
      router.push('/')
    }
    
    const fetchMyPosts = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true)
        const response = await postService.getMyPosts()
        setPosts(response.posts)
      } catch (err) {
        console.error('Error fetching my posts:', err)
        setError('Error when loading your publications.')
      } finally {
        setLoading(false)
      }
    }
    
    if (status === 'authenticated') {
      fetchMyPosts()
    }
  }, [status, router])
  
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to eliminate this publication? This action cannot be undone.')) {
      return;
    }
    
    try {
      await postService.deletePost(postId)
      // Remove the post eliminated from the list
      setPosts(posts.filter(post => post._id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('Error eliminating publication.Try it again.')
    }
  }
  
  // Helper function to obtain the profile image
  const getProfileImage = () => {
    if (session?.user?.image) {
      return session.user.image;
    }
    if (session?.user?.profilePicture) {
      return session.user.profilePicture;
    }
    return null;
  }
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (status === 'unauthenticated') {
    return null
  }
  
  return (
    <div className="container mx-auto px-4 py-16">
      {/* PROFILE INFORMATION */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="flex-shrink-0">
          {getProfileImage() ? (
            <Image 
              src={getProfileImage()!} 
              alt={session?.user?.name || 'Usuario'} 
              width={120} 
              height={120} 
              className="rounded-full"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              <User size={48} />
            </div>
          )}
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {session?.user?.name || 'Usuario'}
          </h1>
          <p className="text-gray-600 mb-4">{session?.user?.email}</p>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button 
              onClick={() => router.push('/posts/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
            >
              <PenTool size={18} />
              New post
            </button>
          </div>
        </div>
      </div>
      
      {/* My publications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FileText className="mr-2 text-blue-600" size={24} />
          My publications
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-500 mb-4">You have not yet created any publication</p>
            <button 
              onClick={() => router.push('/posts/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <PenTool size={18} />
              Create new post
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 
                    className="text-xl font-medium text-gray-800 cursor-pointer hover:text-blue-600 transition"
                    onClick={() => router.push(`/posts/${post.slug}`)}
                  >
                    {post.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                    <span>
                      {new Date(post.createdAt).toLocaleDateString('en-US')}
                    </span>
                    <span className="flex items-center">
                      {post.status === 'published' ? (
                        <span className="text-green-600 flex items-center">
                          <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                          Published
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center">
                          <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                          Draft
                        </span>
                      )}
                    </span>
                    <span>{post.comments.length} comments</span>
                    <span>{post.views} views</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => router.push(`/posts/edit/${post._id}`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md transition"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeletePost(post._id)}
                    className="bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 p-2 rounded-md transition"
                    title="Eliminate"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}