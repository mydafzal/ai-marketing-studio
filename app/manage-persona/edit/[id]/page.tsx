'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import OnboardingLocationSelector, { LocationData } from '@/components/onboarding-location-selector'
import { useRouter, useParams } from 'next/navigation'
import DeletePersonaModal from '@/components/delete-persona-modal'
import { validatePersonaForm } from '@/lib/validations'

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

export default function EditPersonaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [formData, setFormData] = useState({
    companyName: '',
    websiteLink: '',
    privacyPolicyLink: '',
    language: '',
    locations: [] as LocationData
  })
  const [inputError, setInputError] = useState({
    companyName: '',
    websiteLink: '',
    privacyPolicyLink: '',
    language: '',
    locations: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    isDeleting: false
  })

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch(`/api/persona/${id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch persona')
        }
        const data = await res.json()
        if (data.success && data.data) {
          const mappedPersona = mapPersona(data.data)
          setFormData({
            companyName: mappedPersona.companyName || '',
            websiteLink: mappedPersona.websiteLink || '',
            privacyPolicyLink: mappedPersona.privacyPolicyLink || '',
            language: mappedPersona.language || '',
            locations: Array.isArray(mappedPersona.locations) ? mappedPersona.locations : []
          })
        } else {
          throw new Error(data.error || 'Failed to fetch persona details')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading persona')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) {
      fetchPersona()
    }
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))

    if (formattedValue.length > 0) {
      setInputError(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleLocationChange = (value: React.SetStateAction<LocationData>) => {
    if (typeof value === 'function') {
      setFormData(prev => ({
        ...prev,
        locations: value(prev.locations)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        locations: value
      }))
    }
  }

  const validate = () => {
    const { errors, hasErrors } = validatePersonaForm(formData)
    setInputError(errors)
    return !hasErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    try {
      const resp = await fetch(`/api/persona/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName,
          website_link: formData.websiteLink,
          privacy_policy_link: formData.privacyPolicyLink,
          preferred_language: formData.language,
          location_data: formData.locations
        })
      })
      const result = await resp.json()
      if (result.success) {
        router.push('/manage-persona')
      } else {
        setError(result.error || 'Failed to update persona')
      }
    } catch (e) {
      setError('Error updating persona')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }))
      const resp = await fetch(`/api/persona/${id}`, {
        method: 'DELETE'
      })
      const result = await resp.json()
      if (result.success) {
        router.push('/manage-persona')
      } else {
        throw new Error(result.error || 'Failed to delete persona')
      }
    } catch (e) {
      setError('Error deleting persona')
    } finally {
      setDeleteModal({ isOpen: false, isDeleting: false })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center py-10">
      <div className="w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-[#1A1D29] rounded-xl shadow-lg p-8 space-y-8 border border-gray-800"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Edit Persona</h1>
            <button
              type="button"
              onClick={() => router.push('/manage-persona')}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.companyName ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="Enter your company name"
            />
            {inputError.companyName && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.companyName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Website Link</label>
            <input
              type="url"
              name="websiteLink"
              value={formData.websiteLink}
              onChange={handleInputChange}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.websiteLink ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="https://www.yourwebsite.com"
            />
            {inputError.websiteLink && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.websiteLink}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Privacy Policy Link</label>
            <input
              type="url"
              name="privacyPolicyLink"
              value={formData.privacyPolicyLink}
              onChange={handleInputChange}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.privacyPolicyLink ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="https://www.yourwebsite.com/privacy-policy"
            />
            {inputError.privacyPolicyLink && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.privacyPolicyLink}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Preferred Language</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.language ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
            >
              <option value="">Select language</option>
              <option value="en">English</option>
              <option value="nl">Dutch</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
              <option value="it">Italian</option>
              <option value="fr">French</option>
              <option value="pt">Portuguese</option>
            </select>
            {inputError.language && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.language}
              </p>
            )}
          </div>

          <div>
            <OnboardingLocationSelector
              locations={formData.locations}
              setLocations={handleLocationChange}
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setDeleteModal({ isOpen: true, isDeleting: false })}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30"
            >
              Delete Persona
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#4BF29C] to-[#38A169] text-[#0F1117] font-medium hover:scale-105 transition disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <DeletePersonaModal
        isOpen={deleteModal.isOpen}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, isDeleting: false })}
        onConfirm={handleDelete}
      />
    </div>
  )
} 