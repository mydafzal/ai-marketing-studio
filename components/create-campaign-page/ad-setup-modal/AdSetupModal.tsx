import React, { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Settings, Image as ImageIcon, Edit3, MapPin, Users, Filter, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MasterFlowResponse } from '../steps/review-step' // Re-using the type from review-step
import { AudienceSettings } from '@/components/stocks/create-campaign-screen/components/AudienceSettings' // Re-using original component
import { Gender } from '@/components/stocks/create-campaign-screen/types'

interface AdSetupModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  masterFlowData: MasterFlowResponse
  adHeadline: string
  adText: string
  campaignObjective: string
  targetedLocations: string[]
  ageRange: [number, number]
  gender: 'All' | 'Male' | 'Female'
  targetedInterests: string[]
  behavioralFilters: string[]
  demographicFilters: string[]
  adPlacements: string[]
  budget: string
  creatives: any[]
  websiteUrl: string
  currency: string
  onCreativesUpdated: (creatives: any[]) => void
  onLeadFormUpdated: (fields: any) => void
  onTargetingUpdated: (targeting: any) => void
  onPlacementsUpdated: (placements: string[]) => void
}

type Tab = 'creative' | 'placements' | 'targeting' | 'lead-form'

export function AdSetupModal({
  isOpen,
  onOpenChange,
  masterFlowData,
  adHeadline,
  adText,
  creatives,
  websiteUrl,
  currency,
  onCreativesUpdated,
  onLeadFormUpdated,
  onTargetingUpdated,
  onPlacementsUpdated,
  ...props
}: AdSetupModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('creative')
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState(0)

  // Local state for editing
  const [localCreatives, setLocalCreatives] = useState(creatives)
  const [localAdHeadline, setLocalAdHeadline] = useState(adHeadline)
  const [localAdText, setLocalAdText] = useState(adText)
  
  // Local state for targeting
  const [localTargetedLocations, setLocalTargetedLocations] = useState(props.targetedLocations)
  const [newLocation, setNewLocation] = useState('')
  const [localAgeRange, setLocalAgeRange] = useState<[number, number]>(props.ageRange)
  const [localTargetedInterests, setLocalTargetedInterests] = useState(props.targetedInterests)
  const [newInterest, setNewInterest] = useState('')
  const [localBehavioralFilters, setLocalBehavioralFilters] = useState(props.behavioralFilters)
  const [localDemographicFilters, setLocalDemographicFilters] = useState(props.demographicFilters)
  const [localGender, setLocalGender] = useState<Gender>(props.gender)
  
  // Local state for placements
  const [localPlacements, setLocalPlacements] = useState<string[]>(props.adPlacements)
  
  // Local state for lead form
  const [localLeadForm, setLocalLeadForm] = useState(masterFlowData.lead_form_content?.lead_form_data)

  const currentCreative = localCreatives[currentCreativeIndex]
  const previewUrl = `https://www.facebook.com/ads/previews/async?ad_id=${currentCreative?.ad_id}&placement=instagram_feed&ad_format=instagram_standard&render_type=platform_web`

  useEffect(() => {
    // When modal opens, sync local state with props
    if (isOpen) {
      setLocalCreatives(creatives)
      const current = creatives[currentCreativeIndex]
      if (current) {
        setLocalAdHeadline(current.title || adHeadline)
        setLocalAdText(current.description || adText)
      }
      setLocalTargetedLocations(props.targetedLocations)
      setLocalAgeRange(props.ageRange)
      setLocalTargetedInterests(props.targetedInterests)
      setLocalBehavioralFilters(props.behavioralFilters)
      setLocalDemographicFilters(props.demographicFilters)
      setLocalGender(props.gender)
      setLocalPlacements(props.adPlacements)
      setLocalLeadForm(masterFlowData.lead_form_content?.lead_form_data)
    }
  }, [isOpen, creatives, adHeadline, adText, currentCreativeIndex, props, masterFlowData])
  
  const handleSave = () => {
    // Save creative changes
    const updatedCreative = {
      ...currentCreative,
      title: localAdHeadline,
      description: localAdText,
    }
    const updatedCreatives = [...localCreatives]
    updatedCreatives[currentCreativeIndex] = updatedCreative
    onCreativesUpdated(updatedCreatives)
    
    // Save targeting changes
    onTargetingUpdated({
        targetedLocations: localTargetedLocations,
        ageRange: localAgeRange,
        gender: localGender,
        targetedInterests: localTargetedInterests,
        behavioralFilters: localBehavioralFilters,
        demographicFilters: localDemographicFilters,
    })

    // Save placement changes
    onPlacementsUpdated(localPlacements)

    // Save lead form changes
    if (localLeadForm) {
        onLeadFormUpdated(localLeadForm)
    }

    onOpenChange(false)
  }

  const renderCreativeTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Panel: Edit fields */}
      <div className="space-y-4">
        {/* Creative Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Creative to Edit</label>
          <div className="flex space-x-2 border-b border-gray-700">
            {localCreatives.map((creative, index) => (
              <button
                key={creative.creative_id || index}
                onClick={() => setCurrentCreativeIndex(index)}
                className={`px-3 py-2 text-sm font-medium ${
                  currentCreativeIndex === index
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Creative {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="headline" className="block text-sm font-medium text-gray-300">Headline</label>
          <input
            id="headline"
            type="text"
            value={localAdHeadline}
            onChange={(e) => setLocalAdHeadline(e.target.value)}
            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
          <textarea
            id="description"
            rows={5}
            value={localAdText}
            onChange={(e) => setLocalAdText(e.target.value)}
            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex flex-col items-center">
        <span className="text-sm text-gray-400 mb-2">Live Preview</span>
        <div className="w-[313px] h-[534px] bg-gray-900 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            width="313"
            height="534"
            className="border-none"
            title="Ad Preview"
          />
        </div>
      </div>
    </div>
  )

  const renderPlacementsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Ad Placements</h3>
      <p className="text-sm text-gray-400">Select where you want your ads to appear.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {props.adPlacements.map(placement => (
          <label key={placement} className="flex items-center space-x-3 bg-gray-900 p-3 rounded-md cursor-pointer hover:bg-gray-700">
            <input
              type="checkbox"
              checked={localPlacements.includes(placement)}
              onChange={() => {
                setLocalPlacements(prev => 
                  prev.includes(placement)
                    ? prev.filter(p => p !== placement)
                    : [...prev, placement]
                )
              }}
              className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">{placement}</span>
          </label>
        ))}
      </div>
    </div>
  )

  const renderTargetingTab = () => (
     <AudienceSettings
        targetedLocations={localTargetedLocations}
        setTargetedLocations={setLocalTargetedLocations}
        newLocation={newLocation}
        setNewLocation={setNewLocation}
        ageRange={localAgeRange}
        setAgeRange={setLocalAgeRange}
        targetedInterests={localTargetedInterests}
        setTargetedInterests={setLocalTargetedInterests}
        newInterest={newInterest}
        setNewInterest={setNewInterest}
        behavioralFilters={localBehavioralFilters}
        setBehavioralFilters={setLocalBehavioralFilters}
        demographicFilters={localDemographicFilters}
        setDemographicFilters={setLocalDemographicFilters}
        gender={localGender}
        setGender={setLocalGender}
      />
  )

  const renderLeadFormTab = () => {
    if(!localLeadForm) {
        return <p className='text-white'>No Lead form data available</p>
    }
    return (
    <div className='text-white space-y-4'>
         <h3 className="text-lg font-medium text-white mb-4">Lead Form Settings</h3>
         <div>
            <label className="text-sm font-medium">Form Name</label>
            <input type="text" value={localLeadForm.lead_form_name} onChange={e => setLocalLeadForm({...localLeadForm, lead_form_name: e.target.value})} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
         </div>
          <div>
            <label className="text-sm font-medium">Form Title</label>
            <input type="text" value={localLeadForm.lead_form_title} onChange={e => setLocalLeadForm({...localLeadForm, lead_form_title: e.target.value})} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
         <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
                value={localLeadForm.lead_form_description}
                onChange={e => setLocalLeadForm({...localLeadForm, lead_form_description: e.target.value})}
                className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={4}
            />
         </div>
         <div>
            <label className="text-sm font-medium">Questions</label>
            <ul className="list-disc list-inside bg-gray-800 p-3 rounded-md mt-1">
                {masterFlowData.lead_form_content?.lead_form_questions?.map((q: string) => <li key={q}>{q.replace(/_/g, ' ')}</li>)}
            </ul>
            <p className="text-xs text-gray-400 mt-2">Questions are currently not editable.</p>
         </div>
    </div>
    )
  }

  const TABS: { id: Tab; name: string; icon: React.ElementType }[] = [
    { id: 'creative', name: 'Creative', icon: ImageIcon },
    { id: 'placements', name: 'Placements', icon: Settings },
    { id: 'targeting', name: 'Targeting', icon: Filter },
    { id: 'lead-form', name: 'Lead Form', icon: FileText },
  ]

  return (
    <Dialog open={isOpen} onClose={() => onOpenChange(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-xl bg-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <Dialog.Title className="text-xl font-semibold text-white">
              Campaign Ad Setup
            </Dialog.Title>
            <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar for tabs */}
            <div className="w-48 border-r border-gray-700 p-4 space-y-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </div>
            
            {/* Main content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'creative' && renderCreativeTab()}
              {activeTab === 'placements' && renderPlacementsTab()}
              {activeTab === 'targeting' && renderTargetingTab()}
              {activeTab === 'lead-form' && renderLeadFormTab()}
            </div>
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)} variant="outline" className="mr-2">Cancel</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 