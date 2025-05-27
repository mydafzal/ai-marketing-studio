'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import OnboardingLocationSelector, { LocationData } from '@/components/onboarding-location-selector'
import { useRouter, useParams } from 'next/navigation'
import DeletePersonaModal from '@/components/delete-persona-modal'
import { validatePersonaForm } from '@/lib/validations'
import { MemoizedReactMarkdown } from '@/components/markdown'

// Utility function to map persona from snake_case to camelCase
function mapPersona(persona: any) {
  return {
    id: persona.id,
    name: persona.name,
    companyName: persona.company_name,
    companyDescription: persona.company_description || '',
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
    name: '',
    companyName: '',
    companyDescription: '',
    websiteLink: '',
    privacyPolicyLink: '',
    language: '',
    locations: [] as LocationData
  })
  const [inputError, setInputError] = useState({
    name: '',
    companyName: '',
    companyDescription: '',
    websiteLink: '',
    privacyPolicyLink: '',
    language: '',
    locations: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
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
            name: mappedPersona.name || '',
            companyName: mappedPersona.companyName || '',
            companyDescription: mappedPersona.companyDescription || '',
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

  // Format URL: remove www. and add https:// if needed
  const formatUrl = (url: string): string => {
    if (!url || url.trim() === '') return url;
    
    // Remove www. if present
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)/i, '');
    
    // Add https:// if not present
    if (!cleanUrl.match(/^https?:\/\//i)) {
      return `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  };

  // Validate URL format with TLD check
  const validateUrlFormat = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty URLs are handled by other validation
    
    try {
      const urlObj = new URL(url.match(/^https?:\/\//i) ? url : `https://${url}`);
      // Check if domain has a TLD (at least one dot in hostname)
      if (!urlObj.hostname.includes('.') || urlObj.hostname.split('.').pop()!.length === 0) {
        return false; // Invalid domain (missing TLD)
      }
      return true;
    } catch (error) {
      return false; // Invalid URL
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
  
  // Handle blur event for URL fields
  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'websiteLink' || name === 'privacyPolicyLink') {
      // Format the URL (remove www. and add https://)
      const formattedUrl = formatUrl(value);
      
      // Update the form data with formatted URL
      setFormData(prev => ({
        ...prev,
        [name]: formattedUrl
      }));
      
      // Validate URL format
      if (formattedUrl && !validateUrlFormat(formattedUrl)) {
        setInputError(prev => ({
          ...prev,
          [name]: 'Please enter a valid URL with a domain extension (e.g. .com)'
        }));
      }
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
          name: formData.name,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
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
        setError(result.error || 'Failed to update customer profile')
      }
    } catch (e) {
      setError('Error updating customer profile')
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
    <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center py-10 relative">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-[#0F1117]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="bg-[#1A1D29] p-8 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center animate-pulse-green">
            <Loader2 className="w-12 h-12 text-[#4BF29C] animate-spin mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Updating Customer Profile...</h3>
            <p className="text-gray-400 text-sm">This may take a moment</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-[#1A1D29] rounded-xl shadow-lg p-8 space-y-8 border border-gray-800"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Edit Customer Profile</h1>
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
              onBlur={(e) => {
                // Auto-generate profile name only on blur and if empty
                if (!formData.name && e.target.value) {
                  const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  setFormData(prev => ({
                    ...prev,
                    name: `${e.target.value} - profile (${todayDate})`
                  }));
                }
              }}
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold">Company Description</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-lg border",
                    !isPreviewMode 
                      ? "bg-[#4BF29C]/20 border-[#4BF29C]/30 text-[#4BF29C]" 
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  )}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-lg border",
                    isPreviewMode 
                      ? "bg-[#4BF29C]/20 border-[#4BF29C]/30 text-[#4BF29C]" 
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  )}
                >
                  Preview
                </button>
              </div>
            </div>
            
            {isPreviewMode ? (
              <div className="min-h-[160px] p-3 bg-[#232736] border border-gray-700 rounded-lg overflow-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <MemoizedReactMarkdown>
                    {formData.companyDescription || '*No description provided*'}
                  </MemoizedReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleInputChange}
                rows={8}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                  inputError.companyDescription ? "border-red-500" : "border-gray-700",
                  "focus:outline-none focus:ring-2 focus:ring-[#4BF29C] resize-y min-h-[160px]"
                )}
                placeholder="Briefly explain what the company does. Markdown formatting is supported (bold, italic, lists, etc)."
              />
            )}
            
            {inputError.companyDescription && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.companyDescription}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Markdown formatting is supported: **bold**, *italic*, ### headers, - lists
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1">
              Profile Name 
              <span className="text-xs text-gray-400 ml-2 font-normal">Choose a name to help you remember this profile</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.name ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="Auto-generated from company name if left empty"
            />
            {inputError.name && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.name}
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
              onBlur={handleUrlBlur}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.websiteLink ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="https://yourwebsite.com"
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
              onBlur={handleUrlBlur}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.privacyPolicyLink ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="https://yourwebsite.com/privacy-policy"
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
              Delete Profile
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