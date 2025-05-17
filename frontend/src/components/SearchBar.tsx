'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const toggleSearch = () => {
    setIsExpanded(!isExpanded)
    if (isExpanded) {
      setQuery('')
    }
  }

  return (
    <div className="relative">
      {isExpanded ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="bg-gray-100 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 md:w-64"
            autoFocus
          />
          <button
            type="button"
            onClick={toggleSearch}
            className="absolute right-3 text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </form>
      ) : (
        <button
          onClick={toggleSearch}
          className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        >
          <Search size={18} className="text-gray-700" />
        </button>
      )}
    </div>
  )
}