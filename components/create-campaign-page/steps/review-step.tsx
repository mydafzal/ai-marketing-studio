'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Play, Eye, Target, MapPin, Users, FileText, Settings2, Edit } from 'lucide-react'
import { StepByStepMediaItem } from '../types'
import { AdSetupModal } from '@/components/create-campaign-page/ad-setup-modal'

// Import types from the original implementation
export interface MasterFlowResponse {
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

  // New state for showing all previews
  const [showAllPreviews, setShowAllPreviews] = useState(false)

  // Preview formats for navigation
  const previewFormats = ['INSTAGRAM_STANDARD', 'INSTAGRAM_STORY', 'FACEBOOK_PROFILE_FEED_MOBILE', 'FACEBOOK_STORY_MOBILE', 'INSTAGRAM_REELS', 'FACEBOOK_REELS_MOBILE']

  // Auto-scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll effect
  useEffect(() => {
    if (!showAllPreviews || !isAutoScrolling) return

    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }

      autoScrollIntervalRef.current = setInterval(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const maxScroll = container.scrollWidth - container.clientWidth
        const currentScroll = container.scrollLeft
        
        // Scroll right slowly (1px per interval)
        if (currentScroll < maxScroll) {
          container.scrollLeft += 1
        } else {
          // Reset to beginning when reaching the end
          container.scrollLeft = 0
        }
      }, 50) // 50ms interval for smooth scrolling
    }

    startAutoScroll()

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [showAllPreviews, isAutoScrolling])

  // Pause auto-scroll on user interaction
  const handleScrollInteraction = () => {
    setIsAutoScrolling(false)
    // Resume auto-scroll after 3 seconds of no interaction
    setTimeout(() => {
      setIsAutoScrolling(true)
    }, 3000)
  }

  // Component for individual preview iframes
  const PreviewIframe = ({ creativeId, format }: { creativeId: string, format: string }) => {
    const [html, setHtml] = useState('')
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
      const fetchPreview = async () => {
        if (!creativeId) return
        setLoading(true)
        try {
          const res = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creativeId}&ad_format=${format}`)
          const json = await res.json()
          if (json.success) setHtml(processHtml(json.preview_html))
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }
      fetchPreview()
    }, [creativeId, format])
    
    if (loading) {
      return <div className="flex items-center justify-center w-full h-full"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/></div>
    }
    
    return <div dangerouslySetInnerHTML={{ __html: html }} className="w-full h-full" />
  }

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
      {/* AI Message with Typing Effect */}
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="flex items-start">
            <div className="mr-3 sm:mr-4 flex-shrink-0">
              {/* Enhanced Color Blob */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(75,242,156,0.7)] sm:shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                  style={{
                    animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                    backgroundSize: "300% 300%"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                    animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                    backgroundSize: "400% 400%",
                    animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                    backgroundSize: "200% 200%",
                    animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-[2px] rounded-full"
                  style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                    animation: "pulse 2s ease-in-out infinite alternate"
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
              <div className="text-white text-sm sm:text-base typing-container">
                Perfect! Let me create your complete campaign setup for you. I&apos;m building your targeting, ad copy, creatives, and all campaign settings. Once I&apos;m done, I&apos;ll show you everything so you can review it all before we launch.
                <br /><br />
                This will take about 45 seconds - perfect time to grab a coffee or stretch your legs! ☕
              </div>
              {isLoading && (
                <div className="mt-4 pt-3 border-t border-gray-600 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4BF29C]"></div>
                  <span className="text-gray-400 text-sm">Working my magic...</span>
                </div>
              )}
              {error && (
                <div className="mt-4 pt-3 border-t border-gray-600">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                    <Button 
                      onClick={callMasterFlowAPI}
                      className="text-xs bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPreviewStep = () => (
    <>
      {!showAllPreviews ? (
        /* Standard Layout - Side by side with consistent spacing */
        <div className="w-full grid gap-6 lg:gap-8 px-2 sm:px-0 grid-cols-1 lg:grid-cols-2">
          {/* Left: AI Message */}
          <div className="w-full flex justify-center lg:justify-start">
            <div className="w-full max-w-xl">
              <div className="flex items-start">
                <div className="mr-3 sm:mr-4 flex-shrink-0">
                  {/* Enhanced Color Blob */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(75,242,156,0.7)] sm:shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                      style={{
                        animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                        backgroundSize: "300% 300%"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                        animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                        backgroundSize: "400% 400%",
                        animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                        backgroundSize: "200% 200%",
                        animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-[2px] rounded-full"
                      style={{
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                        animation: "pulse 2s ease-in-out infinite alternate"
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
                  <div className="text-white text-sm sm:text-base typing-container">
                    Excellent! Here&apos;s how your ad will look on Instagram. I&apos;ve created compelling ad copy and optimized your creative for maximum engagement.
                  </div>
                  
                  {/* Continue Button embedded in AI message */}
                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <Button
                      onClick={() => setCurrentSubStep('targeting')}
                      className="w-full bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Continue to Targeting Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* See All Previews Button embedded in AI message */}
                  <div className="mt-3">
                    <Button
                      onClick={() => setShowAllPreviews(!showAllPreviews)}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      See All Previews
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Single Preview */}
          <div className="w-full">
            <div className="w-full flex justify-center lg:justify-start">
              {masterFlowData && (
                <div className="space-y-4 sm:space-y-6 w-full">
                  {/* Creative Navigation */}
                  {masterFlowData.creatives_and_previews?.creatives && masterFlowData.creatives_and_previews.creatives.length > 1 && (
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-sm text-gray-400">
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

                  {/* Single Preview */}
                  <div className="flex justify-center">
                    <div 
                      className="relative bg-gray-900 rounded-lg overflow-hidden"
                      style={{ width: '313px', height: '534px' }}
                    >
                      {isPreviewLoading ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      ) : previewError ? (
                        <div className="text-red-400 p-4 text-center text-sm">
                          {previewError}
                        </div>
                      ) : (
                        <div 
                          ref={previewRef}
                          className="w-full h-full" 
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
              )}
            </div>
          </div>
        </div>
      ) : (
        /* All Previews Layout - AI Message Centered, Previews Below */
        <div className="w-full flex flex-col items-center justify-center space-y-6 px-2 sm:px-0 min-h-[80vh] pt-40">
          {/* AI Message - Centered */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-xl">
              <div className="flex items-start">
                <div className="mr-3 sm:mr-4 flex-shrink-0">
                  {/* Enhanced Color Blob */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(75,242,156,0.7)] sm:shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                      style={{
                        animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                        backgroundSize: "300% 300%"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                        animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                        backgroundSize: "400% 400%",
                        animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                        backgroundSize: "200% 200%",
                        animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                      }}
                    ></div>
                    <div 
                      className="absolute inset-[2px] rounded-full"
                      style={{
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                        animation: "pulse 2s ease-in-out infinite alternate"
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
                  <div className="text-white text-sm sm:text-base typing-container">
                    Excellent! Here are all your ad previews across different platforms. I&apos;ve optimized your creative for maximum engagement on each platform.
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-600 space-y-3">
                    <Button
                      onClick={() => setCurrentSubStep('targeting')}
                      className="w-full bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Continue to Targeting Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <Button
                      onClick={() => setShowAllPreviews(!showAllPreviews)}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Show Single Preview
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Previews - Horizontal Layout */}
          {masterFlowData && (
            <div className="w-full space-y-4">
              {/* Creative Navigation */}
              {masterFlowData.creatives_and_previews?.creatives && masterFlowData.creatives_and_previews.creatives.length > 1 && (
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-sm text-gray-400">
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

              <h4 className="font-medium text-white text-center mb-4">All Platform Previews</h4>
              
              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden">
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-scroll pb-4 pr-4" 
                  style={{ 
                    scrollbarWidth: 'auto',
                    scrollbarColor: '#4B5563 #1F2937',
                    WebkitOverflowScrolling: 'touch'
                  }}
                  onScroll={handleScrollInteraction}
                  onMouseEnter={handleScrollInteraction}
                >
                  {previewFormats.map((format, idx) => (
                    <div key={format} className="flex flex-col items-center space-y-3 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-400 text-center">
                        {format.replace(/_/g, ' ').replace('PROFILE FEED MOBILE', 'Feed').replace('STANDARD', 'Feed')}
                      </span>
                      <div 
                        className="relative bg-gray-900 rounded-lg overflow-hidden"
                        style={{ width: '313px', height: '534px' }}
                      >
                        <PreviewIframe 
                          creativeId={masterFlowData.creatives_and_previews?.creatives?.[currentCreativeIndex]?.creative_id} 
                          format={format} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: All previews in a horizontal row */}
              <div className="hidden lg:block">
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {previewFormats.map((format, idx) => (
                    <div key={format} className="flex flex-col items-center space-y-3 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-400 text-center">
                        {format.replace(/_/g, ' ').replace('PROFILE FEED MOBILE', 'Feed').replace('STANDARD', 'Feed')}
                      </span>
                      <div 
                        className="relative bg-gray-900 rounded-lg overflow-hidden"
                        style={{ width: '250px', height: '427px' }}
                      >
                        <PreviewIframe 
                          creativeId={masterFlowData.creatives_and_previews?.creatives?.[currentCreativeIndex]?.creative_id} 
                          format={format} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )

  const renderTargetingStep = () => (
    <>
      {/* Desktop: Side-by-side layout, Mobile: Stacked */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-12 px-4 sm:px-6 lg:px-8 min-h-[70vh] pt-24 max-w-7xl mx-auto">
        {/* AI Message - Left on desktop, top on mobile */}
        <div className="w-full lg:w-[45%] lg:max-w-2xl">
          <div className="flex items-start">
            <div className="mr-3 sm:mr-4 flex-shrink-0">
              {/* Enhanced Color Blob */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(147,51,234,0.7)] sm:shadow-[0_0_20px_rgba(147,51,234,0.7)]">
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-[#9333ea] via-[#7c3aed] to-[#6366f1]" 
                  style={{
                    animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                    backgroundSize: "300% 300%"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                    animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                    backgroundSize: "400% 400%",
                    animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                    backgroundSize: "200% 200%",
                    animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-[2px] rounded-full"
                  style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                    animation: "pulse 2s ease-in-out infinite alternate"
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
              <div className="text-white text-sm sm:text-base typing-container">
                Perfect! I&apos;ve optimized your targeting for maximum reach and engagement. Here&apos;s how I&apos;ve set up your audience to get the best results for your campaign.
                {masterFlowData?.age_gender_decision_reason && (
                  <p className="mt-4">{masterFlowData.age_gender_decision_reason}</p>
                )}
              </div>
              {/* Continue Button embedded in AI message */}
              <div className="mt-4 pt-3 border-t border-gray-600">
                <Button
                  onClick={() => setCurrentSubStep('demographics')}
                  className="w-full bg-[#9333ea] text-white hover:bg-[#9333ea]/90 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue to Demographics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              {/* Back Button embedded in AI message */}
              <div className="mt-3">
                <Button
                  onClick={() => setCurrentSubStep('preview')}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Targeting Filters - Right on desktop, below on mobile */}
        <div className="w-full lg:w-[55%] lg:border-l lg:border-[#23263A] lg:pl-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Interest Targeting */}
            {getInterestFilters().length > 0 && (
              <div className="flex flex-col items-center">
                <h4 className="font-semibold text-white mb-2 tracking-wide">Interest Targeting</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getInterestFilters().map((interest, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-[#181B23] border border-[#4BF29C]/40 text-[#4BF29C] rounded-full text-xs font-semibold shadow-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Behavior Targeting */}
            {getBehaviorFilters().length > 0 && (
              <div className="flex flex-col items-center">
                <h4 className="font-semibold text-white mb-2 tracking-wide">Behavioral Targeting</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getBehaviorFilters().map((behavior, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-[#181B23] border border-blue-400/40 text-blue-300 rounded-full text-xs font-semibold shadow-sm"
                    >
                      {behavior}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Demographic Targeting */}
            {getDemographicFilters().length > 0 && (
              <div className="flex flex-col items-center">
                <h4 className="font-semibold text-white mb-2 tracking-wide">Demographic Targeting</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getDemographicFilters().map((demographic, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-[#181B23] border border-green-400/40 text-green-300 rounded-full text-xs font-semibold shadow-sm"
                    >
                      {demographic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Ad Placements */}
            {getPlacementList().length > 0 && (
              <div className="flex flex-col items-center">
                <h4 className="font-semibold text-white mb-2 tracking-wide">Ad Placements</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getPlacementList().map((placement, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#181B23] border border-indigo-400/40 text-indigo-200 rounded-full text-xs font-semibold shadow-sm"
                    >
                      {placement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  const renderDemographicsStep = () => (
    <div className="w-full flex flex-col items-center justify-center space-y-8 px-2 sm:px-0 min-h-[70vh] pt-24">
      {/* AI Message - Centered */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-xl">
          <div className="flex items-start">
            <div className="mr-3 sm:mr-4 flex-shrink-0">
              {/* Enhanced Color Blob */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(255,186,73,0.7)] sm:shadow-[0_0_20px_rgba(255,186,73,0.7)]">
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-[#FFBA49] via-[#FF7D5A] to-[#FF3C6E]" 
                  style={{
                    animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                    backgroundSize: "300% 300%"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                    animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                    backgroundSize: "400% 400%",
                    animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                    backgroundSize: "200% 200%",
                    animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-[2px] rounded-full"
                  style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                    animation: "pulse 2s ease-in-out infinite alternate"
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
              <div className="text-white text-sm sm:text-base typing-container">
                Here&apos;s the demographic breakdown I&apos;ve chosen for your campaign. I&apos;ve analyzed your content and selected the optimal age ranges and gender targeting to reach your ideal customers.
              </div>
            </div>
          </div>
        </div>
      </div>

      {masterFlowData && (
        <div className="w-full max-w-2xl mx-auto bg-[#181B23] rounded-xl border border-[#23263A] p-6 shadow space-y-8">
          {/* Demographics Overview */}
          <div className="flex flex-col md:flex-row md:space-x-8 space-y-6 md:space-y-0 items-center justify-center">
            {/* Age Range */}
            <div className="flex flex-col items-center flex-1">
              <h4 className="font-semibold text-white mb-2 tracking-wide">Age Targeting</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-4 py-2 bg-[#23263A] border border-[#FFBA49]/40 text-[#FFBA49] rounded-full text-lg font-bold shadow-sm">
                  {masterFlowData.suggested_age_min} - {masterFlowData.suggested_age_max}
                </span>
              </div>
              <span className="text-xs text-gray-400">years old</span>
            </div>
            {/* Gender Targeting */}
            <div className="flex flex-col items-center flex-1">
              <h4 className="font-semibold text-white mb-2 tracking-wide">Gender Targeting</h4>
              <div className="flex gap-3 mb-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm border ${masterFlowData.include_male_gender ? 'bg-[#23263A] border-[#4BF29C]/40 text-[#4BF29C]' : 'bg-[#23263A] border-[#23263A] text-gray-500 opacity-60'}`}>Male</span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm border ${masterFlowData.include_female_gender ? 'bg-[#23263A] border-[#FF3C6E]/40 text-[#FF3C6E]' : 'bg-[#23263A] border-[#23263A] text-gray-500 opacity-60'}`}>Female</span>
              </div>
              <span className="text-xs text-gray-400">targeted</span>
            </div>
          </div>

          {/* Budget Breakdown by Audience */}
          {masterFlowData.audiences?.audiences && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white mb-2 tracking-wide">Audience Budget Allocation</h4>
              <div className="space-y-3">
                {masterFlowData.audiences.audiences.map((audience: any, index: number) => (
                  <div key={index} className="bg-[#23263A] rounded-lg p-4 border border-[#23263A]/60 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                      <span className="font-semibold text-white">Audience {audience.audience_nr}</span>
                      <span className="px-3 py-1 bg-[#181B23] border border-[#4BF29C]/40 text-[#4BF29C] rounded-full text-xs font-semibold shadow-sm ml-2">{audience.min_age}-{audience.max_age} yrs</span>
                      <span className="px-3 py-1 bg-[#181B23] border border-[#FF3C6E]/40 text-[#FF3C6E] rounded-full text-xs font-semibold shadow-sm ml-2">{audience.male && audience.female ? 'All' : audience.male ? 'Male' : 'Female'}</span>
                    </div>
                    <span className="font-semibold text-green-400">${audience.budget}/{masterFlowData.currency_code} per day</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Demographics Summary */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white mb-2 tracking-wide">Demographics Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-[#23263A] rounded p-3">
                <p className="text-xs font-medium text-gray-400">Age Range</p>
                <p className="text-lg font-bold text-white">{masterFlowData.suggested_age_max - masterFlowData.suggested_age_min}</p>
                <p className="text-xs text-gray-500">year span</p>
              </div>
              <div className="bg-[#23263A] rounded p-3">
                <p className="text-xs font-medium text-gray-400">Genders</p>
                <p className="text-lg font-bold text-white">
                  {(masterFlowData.include_male_gender ? 1 : 0) + (masterFlowData.include_female_gender ? 1 : 0)}
                </p>
                <p className="text-xs text-gray-500">targeted</p>
              </div>
              <div className="bg-[#23263A] rounded p-3">
                <p className="text-xs font-medium text-gray-400">Audiences</p>
                <p className="text-lg font-bold text-white">{masterFlowData.audiences?.audiences?.length || 0}</p>
                <p className="text-xs text-gray-500">created</p>
              </div>
              <div className="bg-[#23263A] rounded p-3">
                <p className="text-xs font-medium text-gray-400">Budget</p>
                <p className="text-lg font-bold text-white">${budget}</p>
                <p className="text-xs text-gray-500">per day</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto">
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
          adPlacements={getPlacementList()}
          budget={budget}
          creatives={masterFlowData.creatives_and_previews?.creatives || []}
          websiteUrl={link}
          currency={masterFlowData.currency_code}
          onCreativesUpdated={(newCreatives:any)=>{
            setMasterFlowData(prev=> prev ? ({...prev, creatives_and_previews:{...prev.creatives_and_previews, creatives:newCreatives}}) : prev)
          }}
          onTargetingUpdated={(targeting: any) => {
            setMasterFlowData(prev => {
              if (!prev) return null;
              
              const newFilters = [
                ...targeting.targetedInterests.map((name: string) => ({ type: 'interest', name })),
                ...targeting.behavioralFilters.map((name: string) => ({ type: 'behavior', name })),
                ...targeting.demographicFilters.map((name: string) => ({ type: 'demographic', name })),
              ]

              return {
                ...prev,
                selected_locations: targeting.targetedLocations.map((name: string) => ({ name })),
                suggested_age_min: targeting.ageRange[0],
                suggested_age_max: targeting.ageRange[1],
                include_male_gender: targeting.gender === 'All' || targeting.gender === 'Male',
                include_female_gender: targeting.gender === 'All' || targeting.gender === 'Female',
                suggested_targeting_filters: newFilters,
              };
            });
          }}
          onPlacementsUpdated={(placements: string[]) => {
            setMasterFlowData(prev => {
              if (!prev) return null;
              return {
                ...prev,
                placements: placements
              }
            })
          }}
        />
      )}
    </div>
  )
} 