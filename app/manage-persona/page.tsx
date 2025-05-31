'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DeletePersonaModal from '@/components/delete-persona-modal'

// Utility function to map persona from snake_case to camelCase
function mapPersona(persona: any) {
  return {
    id: persona.id,
    name: persona.name,
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
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4BF29C] to-[#38A169] text-[#0F1117] rounded-lg font-medium hover:scale-105 transition"
          >
            <Plus className="w-5 h-5" /> Create New
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-10 h-10 text-[#4BF29C] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">{error}</div>
        ) : (
          <div className="w-full bg-[#1A1D29] rounded-xl shadow-lg p-6 border border-gray-800">
            {personas.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-lg">No customer profiles found.</div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-700">
                      <th className="px-4 py-3 text-base font-semibold">Profile Name</th>
                      <th className="px-4 py-3 text-base font-semibold">Company</th>
                      <th className="px-4 py-3 text-base font-semibold">Website</th>
                      <th className="px-4 py-3 text-base font-semibold">Language</th>
                      <th className="px-4 py-3 text-base font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map(persona => (
                      <tr key={persona.id} className="border-b border-gray-800 hover:bg-[#232736]">
                        <td className="px-4 py-4 text-base">{persona.name || `${persona.companyName} Profile`}</td>
                        <td className="px-4 py-4 text-base">{persona.companyName}</td>
                        <td className="px-4 py-4 text-base text-gray-300">{persona.websiteLink}</td>
                        <td className="px-4 py-4 text-base">{persona.language}</td>
                        <td className="px-4 py-4 flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/manage-persona/edit/${persona.id}`)}
                            className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/30 transition"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, isDeleting: false, personaId: persona.id })}
                            className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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