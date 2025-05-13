'use client'

import React from 'react'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="search"
          className="block w-full p-3 pl-10 text-sm text-white border border-[#2A2E3A] rounded-lg bg-[#1A1D29] focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}