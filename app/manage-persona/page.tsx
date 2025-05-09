'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DeletePersonaModal from '@/components/delete-persona-modal'

// Utility function to map persona from snake_case to camelCase
function mapPersona(persona: any) {
  return {
    id: persona.id,
    companyName: persona.company_name,
    websiteLink: persona.website_link,
    language: persona.preferred_language,
    locations: persona.location_data,
    createdAt: persona.created_at,
    updatedAt: persona.updated_at,
    ownerId: persona.owner_id,
    privacyPolicyLink: persona.privacy_policy_link,
    websiteData: persona.website_data
  }
}

// --- MAIN DASHBOARD ---
export default function PersonaDashboard() {
  const [personas, setPersonas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    isDeleting: false,
    personaId: ''
  })
  const router = useRouter()

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/persona')
        const data = await res.json()
        if (data.success) setPersonas(data.data.map(mapPersona))
        else setError('Failed to fetch personas')
      } catch (e) {
        setError('Error fetching personas')
      } finally {
        setLoading(false)
      }
    }
    fetchPersonas()
  }, [])

  const handleDelete = async () => {
    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }))
      const res = await fetch(`/api/persona/${deleteModal.personaId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setPersonas(personas.filter(p => p.id !== deleteModal.personaId))
        setDeleteModal({ isOpen: false, isDeleting: false, personaId: '' })
      } else {
        throw new Error(data.error || 'Failed to delete persona')
      }
    } catch (error) {
      alert('Error deleting persona')
      setDeleteModal(prev => ({ ...prev, isDeleting: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center py-10">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Customer Profiles</h1>
                <button 
            onClick={() => router.push('/manage-persona/create')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4BF29C] to-[#38A169] text-[#0F1117] rounded-lg font-medium hover:scale-105 transition"
          >
            <Plus className="w-4 h-4" /> Create New
                </button>
            </div>
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <table className="w-full bg-[#1A1D29] rounded-xl border border-gray-800">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="p-4">Company</th>
                <th className="p-4">Website</th>
                <th className="p-4">Language</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">No personas found.</td>
                </tr>
              ) : (
                personas.map(persona => (
                  <tr key={persona.id} className="border-b border-gray-800">
                    <td className="p-4">{persona.companyName}</td>
                    <td className="p-4">{persona.websiteLink}</td>
                    <td className="p-4">{persona.language}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/manage-persona/edit/${persona.id}`)}
                        className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                <button
                        onClick={() => setDeleteModal({ isOpen: true, isDeleting: false, personaId: persona.id })}
                        className="px-2 py-1 bg-red-600 rounded hover:bg-red-700"
                        title="Delete"
                >
                        <Trash2 className="w-4 h-4" />
                </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <DeletePersonaModal
        isOpen={deleteModal.isOpen}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, isDeleting: false, personaId: '' })}
        onConfirm={handleDelete}
      />
    </div>
  )
} 