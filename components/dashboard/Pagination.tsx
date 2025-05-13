'use client'

import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  if (totalPages <= 1) return null
  
  return (
    <div className="flex justify-center mt-6 mb-8">
      <nav className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-[#1A1D29] border border-[#2A2E3A] text-gray-300 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1A1D29] border border-[#2A2E3A] text-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-[#1A1D29] border border-[#2A2E3A] text-gray-300 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
          </svg>
        </button>
      </nav>
    </div>
  )
}