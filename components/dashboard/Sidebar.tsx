'use client'

import React from 'react'

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#1A1D29] border-r border-[#2A2E3A] shadow-md">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-6 text-white">Reeply Marketing</h2>
        <nav className="space-y-1">
          <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
            Dashboard
          </a>
          <a href="#" className="block px-4 py-2 text-sm bg-blue-900/40 text-blue-400 font-medium rounded-md">
            Campaigns
          </a>
          <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
            Reports
          </a>
          <a href="#integrations" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
            Integrations
          </a>
        </nav>
      </div>
    </div>
  )
}