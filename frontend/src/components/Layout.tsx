import { ReactNode } from 'react'
import Navbar from './Navbar'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-6">
                {children}
            </main>
            <footer className="bg-gray-800 text-white p-4 text-center">
                © {new Date().getFullYear()} Blog App
            </footer>
        </div>
    )
}