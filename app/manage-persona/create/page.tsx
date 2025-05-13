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
  const [error, setError] = useState<string | null>(null)

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
          name: formData.name,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
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
        setError(result.error || 'Failed to create customer profile')
      }
    } catch (error) {
      setError('Error creating customer profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center py-10 relative">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-[#0F1117]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="bg-[#1A1D29] p-8 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center animate-pulse-green">
            <Loader2 className="w-12 h-12 text-[#4BF29C] animate-spin mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Building Customer Profile...</h3>
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
            <h1 className="text-2xl font-bold">Create Customer Profile</h1>
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
                // Auto-generate profile name only on blur and if not manually set by user
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
            <label className="block text-sm font-semibold mb-1">Company Description</label>
            <textarea
              name="companyDescription"
              value={formData.companyDescription}
              onChange={handleInputChange}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm bg-[#232736] border",
                inputError.companyDescription ? "border-red-500" : "border-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-[#4BF29C]"
              )}
              placeholder="Briefly explain what the company does"
            />
            {inputError.companyDescription && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3" />
                {inputError.companyDescription}
              </p>
            )}
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
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Customer Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 