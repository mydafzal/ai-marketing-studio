'use client'

import React, { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import OnboardingLocationSelector, { LocationData } from '@/components/onboarding-location-selector'
import { useRouter } from 'next/navigation'
import { validatePersonaForm } from '@/lib/validations'

export default function CreatePersonaPage() {
  const router = useRouter()
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
  const [error, setError] = useState<string | null>(null)

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

  const handleLocationChange = (newLocations: LocationData) => {
    setFormData(prev => ({
      ...prev,
      locations: newLocations
    }))
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
    let website_data = ''
    try {
      const resp = await fetch('/api/fasty-bot/proxy-get-website-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_link: formData.websiteLink })
      })
      if (resp.ok) {
        const resp_data = await resp.json()
        website_data = resp_data.response || ''
      }
    } catch (err) {
      website_data = ''
    }

    try {
      const resp = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: 'default_owner',
          company_name: formData.companyName,
          website_link: formData.websiteLink,
          privacy_policy_link: formData.privacyPolicyLink,
          preferred_language: formData.language,
          location_data: formData.locations,
          website_data
        })
      })
      const result = await resp.json()
      if (result.success) {
        router.push('/manage-persona')
      } else {
        setError(result.error || 'Failed to create persona')
      }
    } catch (error) {
      setError('Error creating persona')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center py-10">
      <div className="w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-[#1A1D29] rounded-xl shadow-lg p-8 space-y-8 border border-gray-800"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Create Persona</h1>
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
              setLocations={(value) => {
                if (typeof value === 'function') {
                  handleLocationChange(value(formData.locations))
                } else {
                  handleLocationChange(value)
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#4BF29C] to-[#38A169] text-[#0F1117] font-medium hover:scale-105 transition disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 