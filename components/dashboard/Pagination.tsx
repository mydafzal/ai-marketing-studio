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
  // For debugging, only hide if we have zero pages
  if (totalPages < 1) return null
  
  return (
    <div className="flex justify-center mt-6 mb-8">
      <nav className="flex items-center space-x-2 bg-[#1A1D29] p-2 rounded-lg border border-[#2A2E3A]">
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-[#0A0C14] border border-[#2A2E3A] text-gray-300 disabled:opacity-50"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </button>
        
        {/* Page number buttons - ensure we don't show too many */}
        {(() => {
          // Logic to handle large number of pages
          let pagesToShow = [];
          
          if (totalPages <= 7) {
            // If 7 or fewer pages, show all
            pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
          } else {
            // Always show first page
            pagesToShow.push(1);
            
            // If current page is among first 4 pages
            if (currentPage <= 4) {
              pagesToShow.push(2, 3, 4, 5);
              pagesToShow.push('ellipsis1');
            } 
            // If current page is among last 4 pages
            else if (currentPage >= totalPages - 3) {
              pagesToShow.push('ellipsis1');
              pagesToShow.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
            } 
            // If current page is in the middle
            else {
              pagesToShow.push('ellipsis1');
              pagesToShow.push(currentPage - 1, currentPage, currentPage + 1);
              pagesToShow.push('ellipsis2');
            }
            
            // Always show last page
            pagesToShow.push(totalPages);
          }
          
          return pagesToShow.map((page, index) => {
            if (page === 'ellipsis1' || page === 'ellipsis2') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                  &hellip;
                </span>
              );
            }
            
            return (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#0A0C14] border border-[#2A2E3A] text-gray-300 hover:bg-blue-900/30'
                }`}
              >
                {page}
              </button>
            );
          });
        })()}
        
        {/* Next page button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-[#0A0C14] border border-[#2A2E3A] text-gray-300 disabled:opacity-50"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
          </svg>
        </button>
      </nav>
    </div>
  )
}