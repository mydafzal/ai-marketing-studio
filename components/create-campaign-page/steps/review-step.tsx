'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Play, Eye, Target, MapPin, Users, FileText, Settings2, Edit } from 'lucide-react'
import { StepByStepMediaItem } from '../types'
import { AdSetupModal } from '@/components/create-campaign-page/ad-setup-modal'

// Import types from the original implementation
interface MasterFlowResponse {
  status: string;
  fb_account_id: string;
  campaign_flow_session_id: string;
  ad_creative_text: {
    ad_creative_title: string;
    ad_creative_description: string;
    ad_creative_name: string;
  };
  lead_form_content?: any;
  campaign_name: string;
  campaign_objective: string;
  selected_locations: any[];
  is_location_exact_match: boolean;
  suggested_age_min: number;
  suggested_age_max: number;
  include_male_gender: boolean;
  include_female_gender: boolean;
  age_gender_decision_reason: string;
  suggested_targeting_filters: any;
  creatives_and_previews: {
    success: boolean;
    creatives: any[];
  };
  audiences: {
    success: boolean;
    audiences: any[];
    message: string;
  };
  currency_code: string;
}

interface ReviewStepProps {
  mediaItems: StepByStepMediaItem[]
  link: string
  budget: string
  campaignObjective: string
  setCampaignObjective: (objective: string) => void
  selectedLeadFormId: string
  setSelectedLeadFormId: (id: string) => void
  selectedCustomerProfileId: string
  setSelectedCustomerProfileId: (id: string) => void
  campaignSessionId: string | null
  onPrevious: () => void
}

type ReviewSubStep = 'analyzing' | 'preview' | 'targeting' | 'demographics' | 'leadform' | 'final'

export function ReviewStep({
  mediaItems,
  link,
  budget,
  campaignObjective,
  setCampaignObjective,
  selectedLeadFormId,
  setSelectedLeadFormId,
  selectedCustomerProfileId,
  setSelectedCustomerProfileId,
  campaignSessionId,
  onPrevious
}: ReviewStepProps) {
  const [currentSubStep, setCurrentSubStep] = useState<ReviewSubStep>('analyzing')
  const [isLoading, setIsLoading] = useState(false)
  const [masterFlowData, setMasterFlowData] = useState<MasterFlowResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Ad preview states
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [adFormat, setAdFormat] = useState('INSTAGRAM_STANDARD')
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState(0)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Modal state for editing ad setup
  const [isAdSetupModalOpen, setIsAdSetupModalOpen] = useState(false)

  // Call master flow API on component mount
  useEffect(() => {
    callMasterFlowAPI()
  }, [])

  // Fetch preview when we have creative data
  useEffect(() => {
    if (masterFlowData?.creatives_and_previews?.creatives && currentSubStep === 'preview') {
      fetchAdPreview()
    }
  }, [masterFlowData, currentSubStep, adFormat, currentCreativeIndex])

  const callMasterFlowAPI = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get user details first
      const userDetailResponse = await fetch('/api/kv/fetch-api-token')
      const userData = await userDetailResponse.json()

      if (!userData.success) {
        throw new Error('Failed to fetch user details')
      }

      // Prepare media data
      const imageHashes = mediaItems
        .filter(item => item.type === 'image' && item.hash)
        .map(item => item.hash!)

      const videoIds = mediaItems
        .filter(item => item.type === 'video' && item.hash)
        .map(item => item.hash!)

      // Debug session ID
      console.log('🔍 Campaign Session ID:', campaignSessionId)
      console.log('🔍 Image hashes:', imageHashes)
      console.log('🔍 Video IDs:', videoIds)

      // Prepare request payload
      const requestPayload: any = {
        fb_account_id: userData.account?.fbAccountId || '',
        campaign_flow_session_id: campaignSessionId || `temp_session_${Date.now()}`,
        company_name: userData.account?.companyName || '',
        profile_data: userData.account?.defaultExtraDetails || '',
        location_data: [
          {
            country: {
              name: "Netherlands",
              code: "NL"
            },
            regions: []
          }
        ],
        page_id: userData.account?.fbPageId ? String(userData.account.fbPageId) : '',
        image_hashes: imageHashes,
        video_ids: videoIds,
        daily_campaign_budget: parseFloat(budget),
        website_link: link,
        preferred_language: userData.account?.preferredLanguage || 'en',
        privacy_policy_link: userData.account?.privacy_policy_link || '',
        instagram_account_id: userData.account?.instagramAccountId || '',
        post_assessment_campaign_objective: 'auto'
      }

      // Only add lead form and customer profile IDs if they have values
      if (selectedLeadFormId && selectedLeadFormId.trim() !== '') {
        requestPayload.selectedLeadFormId = selectedLeadFormId
      }
      
      if (selectedCustomerProfileId && selectedCustomerProfileId.trim() !== '') {
        requestPayload.selectedCustomerProfileId = selectedCustomerProfileId
      }

      console.log('📤 Complete payload:', JSON.stringify(requestPayload, null, 2))

      if (campaignObjective && ['recruitment', 'lead_generation', 'conversions', 'awareness'].includes(campaignObjective)) {
        requestPayload.post_assessment_campaign_objective = campaignObjective
      }

      // Call master flow API
      const response = await fetch('/api/master-flow-initiate-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze campaign')
      }

      const data = await response.json()
      setMasterFlowData(data)
      setCurrentSubStep('preview')

    } catch (error) {
      console.error('Master flow error:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze campaign')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdPreview = async () => {
    if (!masterFlowData?.creatives_and_previews?.creatives) return

    const creatives = masterFlowData.creatives_and_previews.creatives
    if (creatives.length === 0) return

    const creative = creatives[currentCreativeIndex]
    if (!creative?.creative_id) return

    setIsPreviewLoading(true)
    setPreviewError(null)

    try {
      const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creative.creative_id}&ad_format=${adFormat}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.preview_html) {
        setPreviewHtml(processHtml(data.preview_html))
      } else {
        throw new Error('Preview data not available')
      }
    } catch (err) {
      console.error('Preview error:', err)
      setPreviewError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const processHtml = (html: string) => {
    // Handle Instagram Actor ID error
    if (html.includes('Instagram Actor ID is required') || html.includes('Select an Instagram account')) {
      const title = masterFlowData?.ad_creative_text?.ad_creative_title || 'Ad Preview'
      const description = masterFlowData?.ad_creative_text?.ad_creative_description || 'Ad description will appear here'
      
      return `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #1A1D29;
                color: white;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .preview-placeholder {
                width: 313px;
                height: 534px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                text-align: center;
                padding: 1rem;
              }
              .ad-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .ad-text {
                font-size: 14px;
                color: #ccc;
              }
            </style>
          </head>
          <body>
            <div class="preview-placeholder">
              <div class="ad-title">${title}</div>
              <div class="ad-text">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</div>
            </div>
          </body>
        </html>
      `
    }

    return html
      .replace(/(<iframe[^>]*)(width="[^"]*"|height="[^"]*")/g, '$1')
      .replace(/(<iframe[^>]*)(style="[^"]*")/g, (match, p1, p2) => {
        return p1 + 'style="width:313px;height:534px;border:none;overflow:hidden;-ms-overflow-style:none;scrollbar-width:none;"'
      })
      .replace(/(<iframe[^>]*)(scrolling="[^"]*")/g, '$1 scrolling="no"')
      .replace(/scale\([^)]*\)/g, 'scale(1)')
      .replace(/transform:[^;]*;/g, 'transform:none;')
      .replace(/zoom:[^;]*;/g, 'zoom:1;')
      .replace(/<head>/g, '<head><style>::-webkit-scrollbar{display:none;width:0;height:0;}body::-webkit-scrollbar{display:none;}</style>')
  }

  const formatObjectsForDisplay = (arr: any[] | undefined) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return "None"
    
    return arr.map(item => {
      if (typeof item === 'string') return item
      if (item.name) return item.name
      if (item.country) return `${item.country}${item.region ? ` (${item.region})` : ''}`
      return JSON.stringify(item)
    }).join(', ')
  }

  const getInterestFilters = () => {
    const targeting = masterFlowData?.suggested_targeting_filters as any
    if (targeting?.targeting_filters?.interest_filters) {
      return Object.keys(targeting.targeting_filters.interest_filters)
    }

    // Fallback: iterate through audiences
    if (masterFlowData?.audiences?.audiences && masterFlowData.audiences.audiences.length > 0) {
      for (const audience of masterFlowData.audiences.audiences) {
        if (
          audience.targeting_filters &&
          audience.targeting_filters.filters &&
          audience.targeting_filters.filters.interest_filters
        ) {
          return Object.keys(audience.targeting_filters.filters.interest_filters)
        }
      }
    }

    // Legacy flat array structure
    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter((f: any) => f.type === 'interest')
        .map((f: any) => f.name)
    }

    return []
  }

  const getBehaviorFilters = () => {
    const targeting = masterFlowData?.suggested_targeting_filters as any
    if (targeting?.targeting_filters?.behaviour_filters) {
      return Object.keys(targeting.targeting_filters.behaviour_filters)
    }

    if (masterFlowData?.audiences?.audiences && masterFlowData.audiences.audiences.length > 0) {
      for (const audience of masterFlowData.audiences.audiences) {
        if (
          audience.targeting_filters &&
          audience.targeting_filters.filters &&
          audience.targeting_filters.filters.behaviour_filters
        ) {
          return Object.keys(audience.targeting_filters.filters.behaviour_filters)
        }
      }
    }

    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter((f: any) => f.type === 'behavior')
        .map((f: any) => f.name)
    }

    return []
  }

  const getDemographicFilters = () => {
    const targeting = masterFlowData?.suggested_targeting_filters as any
    if (targeting?.targeting_filters?.demographic_filters) {
      return Object.keys(targeting.targeting_filters.demographic_filters)
    }

    if (masterFlowData?.audiences?.audiences && masterFlowData.audiences.audiences.length > 0) {
      for (const audience of masterFlowData.audiences.audiences) {
        if (
          audience.targeting_filters &&
          audience.targeting_filters.filters &&
          audience.targeting_filters.filters.demographic_filters
        ) {
          return Object.keys(audience.targeting_filters.filters.demographic_filters)
        }
      }
    }

    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter((f: any) => f.type === 'demographic')
        .map((f: any) => f.name)
    }

    return []
  }

  const getPlacementList = () => {
    const placementsData = (masterFlowData as any)?.placements
    if (placementsData && Array.isArray(placementsData)) {
      return placementsData
    }
    // Fallback default list
    return [
      'Instagram Feed',
      'Instagram Stories',
      'Instagram Explore',
      'Facebook Feed',
      'Facebook Stories',
      'Facebook Reels'
    ]
  }

  const handleLaunchCampaign = async () => {
    if (!masterFlowData) return

    setIsLoading(true)

    try {
      // Get user details
      const userDetailResponse = await fetch('/api/kv/fetch-api-token')
      const userData = await userDetailResponse.json()

      if (!userData.success) {
        throw new Error('Failed to fetch user details')
      }

      // Format account ID
      const fbAccountId = userData.account?.fbAccountId || ''
      const formattedFbAccountId = fbAccountId.startsWith('act_') ? fbAccountId : `act_${fbAccountId}`

      // Prepare finalization payload
      const requestPayload = {
        fb_account_id: formattedFbAccountId,
        campaign_flow_session_id: masterFlowData.campaign_flow_session_id,
        page_id: String(userData.account?.fbPageId || ''),
        publish: true
      }

      // Call finalize API
      const response = await fetch('/api/fasty-bot/proxy-finalize-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to launch campaign')
      }

      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)

    } catch (error) {
      console.error('Launch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to launch campaign')
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToNextCreative = () => {
    const creatives = masterFlowData?.creatives_and_previews?.creatives || []
    if (creatives.length > 1) {
      setCurrentCreativeIndex(prev => (prev + 1) % creatives.length)
    }
  }

  const navigateToPrevCreative = () => {
    const creatives = masterFlowData?.creatives_and_previews?.creatives || []
    if (creatives.length > 1) {
      setCurrentCreativeIndex(prev => (prev - 1 + creatives.length) % creatives.length)
    }
  }

  const renderAnalyzingStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Perfect! Let me analyze your campaign and create the best setup for you...
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              I&apos;m using AI to analyze your content, target audience, optimize your budget, create compelling ad copy, and set up the perfect targeting to maximize your results.
            </p>
            {isLoading && (
              <div className="mt-4 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Analyzing your campaign...</span>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
                <Button 
                  onClick={callMasterFlowAPI}
                  className="mt-2 text-xs"
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Excellent! Here&apos;s how your ad will look to your audience
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              I&apos;ve created compelling ad copy and optimized your creative for maximum engagement. You can preview it across different platforms below.
            </p>
          </div>
        </div>
      </div>

      {masterFlowData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-6">
          {/* Ad Creative Text */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Ad Creative</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Headline:</span>
                <p className="text-gray-900 mt-1">{masterFlowData.ad_creative_text?.ad_creative_title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="text-gray-900 mt-1">{masterFlowData.ad_creative_text?.ad_creative_description}</p>
              </div>
            </div>
          </div>

          {/* Ad Preview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Preview Format</label>
                <select 
                  value={adFormat} 
                  onChange={(e) => setAdFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="INSTAGRAM_STANDARD">Instagram Feed</option>
                  <option value="INSTAGRAM_STORY">Instagram Story</option>
                  <option value="INSTAGRAM_EXPLORE_GRID_HOME">Instagram Explore</option>
                  <option value="FACEBOOK_PROFILE_FEED_MOBILE">Facebook Feed</option>
                  <option value="FACEBOOK_STORY_MOBILE">Facebook Story</option>
                  <option value="FACEBOOK_REELS_MOBILE">Facebook Reels</option>
                  <option value="INSTAGRAM_REELS">Instagram Reels</option>
                </select>
              </div>

              {/* Creative Navigation */}
              {masterFlowData.creatives_and_previews?.creatives && masterFlowData.creatives_and_previews.creatives.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Creative {currentCreativeIndex + 1} of {masterFlowData.creatives_and_previews.creatives.length}
                  </span>
                  <div className="flex space-x-2">
                    <Button onClick={navigateToPrevCreative} variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button onClick={navigateToNextCreative} variant="outline" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Ad Preview */}
            <div className="flex justify-center">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ width: '313px', height: '534px' }}>
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : previewError ? (
                  <div className="text-red-400 p-4 text-center text-sm">
                    {previewError}
                  </div>
                ) : (
                  <div 
                    ref={previewRef}
                    className="flex items-center justify-center" 
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    style={{ 
                      width: '313px',
                      height: '534px',
                      overflow: 'hidden'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Open Ad Setup modal */}
          <Button
            onClick={() => setIsAdSetupModalOpen(true)}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            View & Edit Ad Setup
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setCurrentSubStep('targeting')}
          className="w-full sm:w-auto"
        >
          Continue to Targeting Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderTargetingStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Here&apos;s how I&apos;ve optimized your targeting for maximum reach
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Based on your content and goals, I&apos;ve selected the most effective audience targeting to get you the best results.
            </p>
          </div>
        </div>
      </div>

      {masterFlowData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-6">
          {/* Locations */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Geographic Targeting</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">
                {formatObjectsForDisplay(masterFlowData.selected_locations)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Location Match: {masterFlowData.is_location_exact_match ? 'Exact' : 'Broad'}
              </p>
            </div>
          </div>

          {/* Debug Targeting Structure */}
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-600 text-xs">🔍</span>
                </div>
                <h4 className="font-medium text-gray-900">Debug: Targeting Data Structure</h4>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">Click to view raw targeting data</summary>
                  <pre className="text-gray-600 overflow-auto max-h-40 bg-white p-2 rounded border mt-2">
                    {JSON.stringify(masterFlowData.suggested_targeting_filters, null, 2)}
                  </pre>
                </details>
                <div className="mt-2 text-sm text-gray-700">
                  <p>Interest filters found: {getInterestFilters().length}</p>
                  <p>Behavior filters found: {getBehaviorFilters().length}</p>
                  <p>Demographic filters found: {getDemographicFilters().length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Interest Targeting */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 text-xs">❤️</span>
              </div>
              <h4 className="font-medium text-gray-900">Interest Targeting</h4>
              <span className="text-sm text-gray-500">({getInterestFilters().length} interests)</span>
            </div>
            {getInterestFilters().length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {getInterestFilters().map((interest, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-white border border-purple-400 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  These interests help target users based on their activities, preferences, and behaviors on Facebook and Instagram.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm">No specific interest targeting filters were set for this campaign.</p>
              </div>
            )}
          </div>

          {/* Behavior Targeting */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 text-xs">🎯</span>
              </div>
              <h4 className="font-medium text-gray-900">Behavioral Targeting</h4>
              <span className="text-sm text-gray-500">({getBehaviorFilters().length} behaviors)</span>
            </div>
            {getBehaviorFilters().length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {getBehaviorFilters().map((behavior, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-white border border-blue-400 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {behavior}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Behavioral filters target users based on their actions, purchase history, and usage patterns.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm">No specific behavioral targeting filters were set for this campaign.</p>
              </div>
            )}
          </div>

          {/* Demographic Targeting */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Demographic Targeting</h4>
              <span className="text-sm text-gray-500">({getDemographicFilters().length} demographics)</span>
            </div>
            {getDemographicFilters().length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {getDemographicFilters().map((demographic, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-white border border-orange-400 text-orange-700 rounded-full text-xs font-medium"
                    >
                      {demographic}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Demographic filters help target specific population segments based on life events, family status, and other characteristics.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm">No specific demographic targeting filters were set for this campaign.</p>
              </div>
            )}
          </div>

          {/* Advanced Targeting Details */}
          {masterFlowData.suggested_targeting_filters && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Advanced Targeting</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Targeting Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Total Interests:</span>
                    <p className="text-gray-900">{getInterestFilters().length}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Behaviors:</span>
                    <p className="text-gray-900">{getBehaviorFilters().length}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Demographics:</span>
                    <p className="text-gray-900">{getDemographicFilters().length}</p>
                  </div>
                </div>
                
                {/* Audience Estimate */}
                {masterFlowData.audiences?.audiences && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Audience Groups:</span>
                    <p className="text-gray-900 mt-1">{masterFlowData.audiences.audiences.length} targeted audience groups created</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placements */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h4 className="font-medium text-gray-900">Ad Placements</h4>
              <span className="text-sm text-gray-500">({getPlacementList().length} placements)</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {getPlacementList().map((placement, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white border border-indigo-400 text-indigo-700 rounded-full text-xs font-medium"
                  >
                    {placement}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600">
                Placements indicate where your ads will appear across Facebook and Instagram networks.
              </p>
            </div>
          </div>

          {/* AI Reasoning */}
          {masterFlowData.age_gender_decision_reason && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs">🤖</span>
                </div>
                <h4 className="font-medium text-gray-900">AI Targeting Reasoning</h4>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-900">{masterFlowData.age_gender_decision_reason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setCurrentSubStep('preview')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Preview
        </Button>
        <Button
          onClick={() => setCurrentSubStep('demographics')}
          className="w-full sm:w-auto"
        >
          Continue to Demographics
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderDemographicsStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Here&apos;s the demographic breakdown I&apos;ve chosen for your campaign
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              I&apos;ve analyzed your content and selected the optimal age ranges and gender targeting to reach your ideal customers.
            </p>
          </div>
        </div>
      </div>

      {masterFlowData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-6">
          {/* Demographics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Range */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                  <span className="text-orange-600 text-xs">📅</span>
                </div>
                <h4 className="font-medium text-gray-900">Age Targeting</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {masterFlowData.suggested_age_min} - {masterFlowData.suggested_age_max}
                </p>
                <p className="text-sm text-gray-600">years old</p>
                <div className="mt-3 bg-orange-100 rounded p-2">
                  <p className="text-xs text-orange-800">
                    Age range optimized for your campaign objective
                  </p>
                </div>
              </div>
            </div>

            {/* Gender Targeting */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs">👥</span>
                </div>
                <h4 className="font-medium text-gray-900">Gender Targeting</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={masterFlowData.include_male_gender}
                      readOnly
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-900 font-medium">Male</span>
                    {masterFlowData.include_male_gender && (
                      <span className="text-green-600 text-sm">✓ Included</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={masterFlowData.include_female_gender}
                      readOnly
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-900 font-medium">Female</span>
                    {masterFlowData.include_female_gender && (
                      <span className="text-green-600 text-sm">✓ Included</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Breakdown by Audience */}
          {masterFlowData.audiences?.audiences && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-green-600 text-xs">💰</span>
                </div>
                <h4 className="font-medium text-gray-900">Audience Budget Allocation</h4>
                <span className="text-sm text-gray-500">({masterFlowData.audiences.audiences.length} audiences)</span>
              </div>
              <div className="space-y-3">
                {masterFlowData.audiences.audiences.map((audience: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        Audience {audience.audience_nr}
                      </span>
                      <span className="font-semibold text-green-600">
                        ${audience.budget}/{masterFlowData.currency_code} per day
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Age Range:</span>
                        <p className="text-gray-900">{audience.min_age}-{audience.max_age} years</p>
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span>
                        <p className="text-gray-900">{audience.male && audience.female ? 'All Genders' : audience.male ? 'Male' : 'Female'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Demographics Summary */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 text-xs">📊</span>
              </div>
              <h4 className="font-medium text-gray-900">Demographics Summary</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Age Range</p>
                  <p className="text-lg font-bold text-gray-900">{masterFlowData.suggested_age_max - masterFlowData.suggested_age_min}</p>
                  <p className="text-xs text-gray-500">year span</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Genders</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(masterFlowData.include_male_gender ? 1 : 0) + (masterFlowData.include_female_gender ? 1 : 0)}
                  </p>
                  <p className="text-xs text-gray-500">targeted</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Audiences</p>
                  <p className="text-lg font-bold text-gray-900">{masterFlowData.audiences?.audiences?.length || 0}</p>
                  <p className="text-xs text-gray-500">created</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Budget</p>
                  <p className="text-lg font-bold text-gray-900">${budget}</p>
                  <p className="text-xs text-gray-500">per day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setCurrentSubStep('targeting')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Targeting
        </Button>
        <Button
          onClick={() => masterFlowData?.lead_form_content ? setCurrentSubStep('leadform') : setCurrentSubStep('final')}
          className="w-full sm:w-auto"
        >
          {masterFlowData?.lead_form_content ? 'Review Lead Form' : 'Final Review'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderLeadFormStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Perfect! I&apos;ve also created a lead form to capture customer information
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              This lead form will help you collect valuable customer data directly from Facebook and Instagram ads.
            </p>
          </div>
        </div>
      </div>

      {masterFlowData?.lead_form_content && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-6">
          {/* Lead Form Overview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
                <span className="text-indigo-600 text-xs">📝</span>
              </div>
              <h4 className="font-medium text-gray-900">Lead Form Details</h4>
            </div>
            
            {/* Basic Form Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Form Name:</span>
                <p className="text-gray-900 mt-1 font-medium">{masterFlowData.lead_form_content.lead_form_data?.lead_form_name || 'Lead Form'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Form Title:</span>
                <p className="text-gray-900 mt-1 font-medium">{masterFlowData.lead_form_content.lead_form_data?.lead_form_title || 'Get in Touch'}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">Description:</span>
              <div className="mt-1 bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">{masterFlowData.lead_form_content.lead_form_data?.lead_form_description || 'Please fill out this form to learn more.'}</p>
              </div>
            </div>
          </div>

          {/* Form Questions */}
          {masterFlowData.lead_form_content.lead_form_questions && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs">❓</span>
                </div>
                <h4 className="font-medium text-gray-900">Form Questions</h4>
                <span className="text-sm text-gray-500">({masterFlowData.lead_form_content.lead_form_questions.length} questions)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {masterFlowData.lead_form_content.lead_form_questions.map((question: string, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {question.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thank You Message */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                <span className="text-green-600 text-xs">✅</span>
              </div>
              <h4 className="font-medium text-gray-900">Thank You Message</h4>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-gray-900">{masterFlowData.lead_form_content.lead_form_data?.lead_form_thank_you_text || 'Thank you for your interest!'}</p>
            </div>
          </div>

          {/* Thank You Page Title & Follow-up */}
          {(masterFlowData.lead_form_content.lead_form_data?.lead_form_thank_you_page_title || masterFlowData.lead_form_content.lead_form_data?.follow_up_url) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                  <span className="text-orange-600 text-xs">🚀</span>
                </div>
                <h4 className="font-medium text-gray-900">Thank You Page Settings</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {masterFlowData.lead_form_content.lead_form_data?.lead_form_thank_you_page_title && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Thank You Page Title</span>
                    <p className="text-gray-900 mt-1 font-medium">
                      {masterFlowData.lead_form_content.lead_form_data.lead_form_thank_you_page_title}
                    </p>
                  </div>
                )}
                {masterFlowData.lead_form_content.lead_form_data?.follow_up_url && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Follow-Up URL</span>
                    <a
                      href={masterFlowData.lead_form_content.lead_form_data.follow_up_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline break-all mt-1 block"
                    >
                      {masterFlowData.lead_form_content.lead_form_data.follow_up_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy & Compliance */}
          {(masterFlowData.lead_form_content.lead_form_data?.privacy_policy_link_text || masterFlowData.lead_form_content.lead_form_data?.lead_form_data_usage_disclaimer) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-red-600 text-xs">🔒</span>
                </div>
                <h4 className="font-medium text-gray-900">Privacy & Compliance</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                {masterFlowData.lead_form_content.lead_form_data?.privacy_policy_link_text && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Privacy Policy Text:</span>
                    <p className="text-gray-900 mt-1">
                      {masterFlowData.lead_form_content.lead_form_data.privacy_policy_link_text}
                    </p>
                  </div>
                )}
                {masterFlowData.lead_form_content.lead_form_data?.lead_form_data_usage_disclaimer && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Data Usage Disclaimer:</span>
                    <p className="text-gray-900 mt-1 whitespace-pre-line">
                      {masterFlowData.lead_form_content.lead_form_data.lead_form_data_usage_disclaimer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta Information */}
          {(masterFlowData.lead_form_content.lead_form_data?.company_name || masterFlowData.lead_form_content.lead_form_data?.lead_form_locale) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-600 text-xs">ℹ️</span>
                </div>
                <h4 className="font-medium text-gray-900">Meta Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {masterFlowData.lead_form_content.lead_form_data?.company_name && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Company Name</span>
                    <p className="text-gray-900 mt-1 font-medium">
                      {masterFlowData.lead_form_content.lead_form_data.company_name}
                    </p>
                  </div>
                )}
                {masterFlowData.lead_form_content.lead_form_data?.lead_form_locale && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Locale</span>
                    <p className="text-gray-900 mt-1 font-medium">
                      {masterFlowData.lead_form_content.lead_form_data.lead_form_locale}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Summary */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 text-xs">📊</span>
              </div>
              <h4 className="font-medium text-gray-900">Form Summary</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Questions</p>
                  <p className="text-lg font-bold text-gray-900">{masterFlowData.lead_form_content.lead_form_questions?.length || 0}</p>
                  <p className="text-xs text-gray-500">total</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-lg font-bold text-gray-900">Lead</p>
                  <p className="text-xs text-gray-500">generation</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Platform</p>
                  <p className="text-lg font-bold text-gray-900">FB/IG</p>
                  <p className="text-xs text-gray-500">integrated</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-lg font-bold text-green-600">Ready</p>
                  <p className="text-xs text-gray-500">to launch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setCurrentSubStep('demographics')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Demographics
        </Button>
        <Button
          onClick={() => setCurrentSubStep('final')}
          className="w-full sm:w-auto"
        >
          Final Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderFinalStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Excellent! Your campaign is ready to launch
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              I&apos;ve optimized everything for maximum performance. Your campaign will start running as soon as you hit launch, and you&apos;ll begin seeing results shortly after.
            </p>
          </div>
        </div>
      </div>

      {masterFlowData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
          <h4 className="font-medium text-gray-900 mb-4">Campaign Summary</h4>
          
          <div className="grid gap-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Campaign Name:</span>
              <span className="font-medium text-gray-900">{masterFlowData.campaign_name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Objective:</span>
              <span className="font-medium text-gray-900">{masterFlowData.campaign_objective}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Budget:</span>
              <span className="font-medium text-gray-900">${budget} {masterFlowData.currency_code}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Target Locations:</span>
              <span className="font-medium text-gray-900">
                {masterFlowData.selected_locations?.length || 0} location(s)
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Age Range:</span>
              <span className="font-medium text-gray-900">
                {masterFlowData.suggested_age_min}-{masterFlowData.suggested_age_max} years
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Creatives:</span>
              <span className="font-medium text-gray-900">
                {masterFlowData.creatives_and_previews?.creatives?.length || 0} creative(s)
              </span>
            </div>

            {masterFlowData.lead_form_content && (
              <div className="flex justify-between">
                <span className="text-gray-600">Lead Form:</span>
                <span className="font-medium text-green-600">✓ Included</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Campaign Launched!</h3>
            <p className="text-gray-600">Your campaign is now live and will start running soon.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setCurrentSubStep(masterFlowData?.lead_form_content ? 'leadform' : 'demographics')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleLaunchCampaign}
          disabled={isLoading}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Launching...
            </div>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Launch Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentSubStep) {
      case 'analyzing':
        return renderAnalyzingStep()
      case 'preview':
        return renderPreviewStep()
      case 'targeting':
        return renderTargetingStep()
      case 'demographics':
        return renderDemographicsStep()
      case 'leadform':
        return renderLeadFormStep()
      case 'final':
        return renderFinalStep()
      default:
        return renderAnalyzingStep()
    }
  }

  return (
    <div className="w-full">
      {renderCurrentStep()}
      
      {/* Back button for going to previous step of campaign creation */}
      {currentSubStep === 'analyzing' && !isLoading && !masterFlowData && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button 
            onClick={onPrevious}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budget
          </Button>
        </div>
      )}

      {/* Legacy Ad Setup Modal reused for editing */}
      {masterFlowData && (
        <AdSetupModal
          isOpen={isAdSetupModalOpen}
          onOpenChange={setIsAdSetupModalOpen}
          masterFlowData={masterFlowData}
          adHeadline={masterFlowData.ad_creative_text?.ad_creative_title || ''}
          adText={masterFlowData.ad_creative_text?.ad_creative_description || ''}
          campaignObjective={masterFlowData.campaign_objective || campaignObjective}
          targetedLocations={masterFlowData.selected_locations?.map((l:any)=> l.name) || []}
          ageRange={[masterFlowData.suggested_age_min, masterFlowData.suggested_age_max]}
          gender={masterFlowData.include_male_gender && masterFlowData.include_female_gender ? 'All' : masterFlowData.include_male_gender ? 'Male' : 'Female'}
          targetedInterests={getInterestFilters()}
          behavioralFilters={getBehaviorFilters()}
          demographicFilters={getDemographicFilters()}
          adPlacements={getPlacementList() as any}
          budget={budget}
          creatives={masterFlowData.creatives_and_previews?.creatives || []}
          websiteUrl={link}
          currency={masterFlowData.currency_code}
          onCreativesUpdated={(newCreatives:any)=>{
            setMasterFlowData(prev=> prev ? ({...prev, creatives_and_previews:{...prev.creatives_and_previews, creatives:newCreatives}}) : prev)
          }}
          onLeadFormUpdated={(fields:any)=>{
            setMasterFlowData(prev=> prev ? ({...prev, lead_form_content:{...prev.lead_form_content, lead_form_data:{...prev.lead_form_content.lead_form_data, ...fields}}}) : prev)
          }}
        />
      )}
    </div>
  )
} 