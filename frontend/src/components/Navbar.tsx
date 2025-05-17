'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
    Home,
    PenTool,
    MessageCircle,
    User,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'
import SearchBar from './SearchBar'

export default function Navbar() {
    const { data: session } = useSession()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen)
    }

    return (
        <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4 py-3">
                {/* Desktop Navigation */}
                <div className="hidden md:flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <MessageCircle className="text-blue-600" size={30} />
                        <span className="text-2xl font-bold text-gray-800">Postly</span>
                    </Link>

                    {/* Menú de Navegación */}
                    <div className="flex items-center space-x-6">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                        >
                            <Home size={20} />
                            <span>Home</span>
                        </Link>

                        <Link
                            href="/posts"
                            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                        >
                            <MessageCircle size={20} />
                            <span>Posts</span>
                        </Link>

                        {session && (
                            <Link
                                href="/posts/new"
                                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                            >
                                <PenTool size={20} />
                                <span>Create Post</span>
                            </Link>
                        )}

                        {/* Barra de búsqueda */}
                        <SearchBar />

                        {/* Perfil o Inicio de Sesión */}
                        {session ? (
                            <div className="flex items-center space-x-3">
                                <Link href="/profile" className="flex items-center space-x-2">
                                    {session.user?.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt="Perfil"
                                            width={36}
                                            height={36}
                                            className="rounded-full"
                                        />
                                    ) : session.user?.profilePicture ? (
                                        <Image
                                            src={session.user.profilePicture}
                                            alt="Perfil"
                                            width={36}
                                            height={36}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <User size={24} className="text-gray-600" />
                                    )}
                                    <span className="text-gray-700">
                                        {session.user?.name?.split(' ')[0]}
                                    </span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center space-x-2"
                            >
                                <span>Log In</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <MessageCircle className="text-blue-600" size={26} />
                        <span className="text-xl font-bold text-gray-800">Postly</span>
                    </Link>

                    <div className="flex items-center space-x-3">
                        <SearchBar />

                        <button onClick={toggleMobileMenu} className="text-gray-700">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden pt-4 pb-2 border-t mt-3">
                        <div className="flex flex-col space-y-3">
                            <Link
                                href="/"
                                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Home size={20} />
                                <span>Home</span>
                            </Link>

                            <Link
                                href="/posts"
                                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <MessageCircle size={20} />
                                <span>Posts</span>
                            </Link>

                            {session && (
                                <Link
                                    href="/posts/new"
                                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <PenTool size={20} />
                                    <span>Create Post</span>
                                </Link>
                            )}

                            {session ? (
                                <>
                                    <Link
                                        href="/profile"
                                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {session.user?.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt="Perfil"
                                                width={24}
                                                height={24}
                                                className="rounded-full"
                                            />
                                        ) : session.user?.profilePicture ? (
                                            <Image
                                                src={session.user.profilePicture}
                                                alt="Perfil"
                                                width={24}
                                                height={24}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <User size={20} />
                                        )}
                                        <span>My Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition py-2"
                                    >
                                        <span>Log Out</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => signIn('google')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition mt-2"
                                >
                                    Log In
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}