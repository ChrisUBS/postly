'use client'

import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { MessageCircle, PenTool, Users } from 'lucide-react'

export default function WelcomePage() {
    const { data: session } = useSession()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pt-20">
            <div className="container mx-auto px-4 py-16">
                {/* Mensaje Principal */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
                        <MessageCircle size={50} className="text-blue-600" />
                        Welcome to Postly
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        A platform to share ideas, connect with people, and explore fascinating conversations all in one place.
                    </p>
                </div>

                {/* Sección de Características */}
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                    {/* Crear Posts */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition">
                        <PenTool size={50} className="mx-auto text-blue-600 mb-4" />
                        <p className="text-gray-600">
                        <h3 className="text-xl font-semibold mb-2">Create Posts</h3>
                            Share your thoughts, stories, and ideas with our community.
                        </p>
                    </div>

                    {/* Explorar Contenido */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition">
                        <MessageCircle size={50} className="mx-auto text-green-600 mb-4" />
                        <p className="text-gray-600">
                        <h3 className="text-xl font-semibold mb-2">Explore Conversations</h3>
                            Discover amazing posts and participate in relevant conversations.
                        </p>
                    </div>

                    {/* Comunidad */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition">
                        <Users size={50} className="mx-auto text-purple-600 mb-4" />
                        <p className="text-gray-600">
                        <h3 className="text-xl font-semibold mb-2">Connect</h3>
                            Meet people with similar interests and expand your network.
                        </p>
                    </div>
                </div>

                {/* Llamado a la Acción */}
                <div className="text-center">
                    {session ? (
                        <Link
                            href="/posts"
                            className="bg-blue-600 text-white px-6 py-3 rounded-md text-xl hover:bg-blue-700 transition inline-flex items-center gap-2"
                        >
                            Explore Posts <MessageCircle size={24} />
                        </Link>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md text-xl hover:bg-blue-700 transition inline-flex items-center gap-2"
                        >
                            Join Now <PenTool size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}