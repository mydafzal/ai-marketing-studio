"use client"

import { toggleAdCreativeStatus } from "@/app/api/fasty-bot/toggle-ad-creative-status";
import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Award, ChevronLeft, ChevronRight, ThumbsUp, Eye, Clock, DollarSign, Target, Brain, Users, Sparkles, BarChart3, Zap } from "lucide-react"
import { CampaignContext } from "@/components/contexts/campaign-context"
import { VideoPlayer } from "@/components/stocks/video-player"

// AI hooking (for forwarding metrics to AI) - silent mode
import { useActions, useAIState, useUIState } from "ai/rsc"
import { Message } from "ai"

// Import your existing metrics function & types
import { getAllAdMetricsByCampaignId } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

// Import sub-components
import { AdPreview } from "./AdPreview"
import { CreativeDisplay } from "./CreativeDisplay"
import { EnhancedMetricItem } from "./EnhancedMetricItem"
import { 
  AdCreative, 
  RawCreative, 
  getPerformanceScore, 
  getCombinedMetrics,
  IMAGE_AD_FORMATS, 
  VIDEO_AD_FORMATS, 
  AD_FORMAT_LABELS 
} from "./types"

const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || ""

// Main Dashboard
const AdCreativesComparison: React.FC<{ campaignId?: string, skipAiThoughts?: boolean }> = ({
  campaignId,
  skipAiThoughts = false
}) => {
  const { campaign } = useContext(CampaignContext)
  const effectiveCampaignId = campaignId || campaign?.id

  const [rawCreatives, setRawCreatives] = useState<RawCreative[]>([])
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for viewing creative details
  const [viewingCreative, setViewingCreative] = useState<AdCreative | null>(null)
  const [adFormat, setAdFormat] = useState<string>("INSTAGRAM_STANDARD")

  // State for editing creative
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null)
  const [editName, setEditName] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>("")

  // AI thought simulation states
  const [showingAiThoughts, setShowingAiThoughts] = useState(false) // FIXED: Never show by default
  const [completedThoughts, setCompletedThoughts] = useState<number[]>([])

  const initialFetchDone = useRef(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const { submitUserMessage } = useActions()
  const [aiState, setAIState] = useAIState()
  const [, setMessages] = useUIState<any>()

  // AI thoughts array
  const aiThoughts = [
    { id: 1, icon: <Brain className="size-4 text-[#4BF29C]" />, text: "Analyzing ad creative performance metrics..." },
    { id: 2, icon: <Users className="size-4 text-[#4BF29C]" />, text: "Identifying audience engagement patterns..." },
    { id: 3, icon: <BarChart3 className="size-4 text-[#4BF29C]" />, text: "Calculating conversion rates and ROI..." },
    { id: 4, icon: <Sparkles className="size-4 text-[#FF7D5A]" />, text: "Determining top-performing creatives..." },
    { id: 5, icon: <Zap className="size-4 text-[#4BF29C]" />, text: "Preparing visualization of results..." }
  ]

  // AI thought simulation
  useEffect(() => {
    if (showingAiThoughts) {
      // Show thoughts sequentially with a delay
      const thoughtTimers = aiThoughts.map((thought, index) => {
        return setTimeout(() => {
          setCompletedThoughts(prev => [...prev, thought.id])
          
          // When all thoughts are complete, hide the overlay
          if (index === aiThoughts.length - 1) {
            setTimeout(() => {
              setShowingAiThoughts(false)
            }, 1000)
          }
        }, 800 * (index + 1)) // Show a new thought every 800ms
      })
      
      // Cleanup timers on unmount
      return () => {
        thoughtTimers.forEach(timer => clearTimeout(timer))
      }
    }
  }, [showingAiThoughts])

  // Get image details when editing a creative
  const getImageDetail = useCallback((imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then((response) => response.json())
      .then((imageDetail) => {
        if (editingCreative) {
          setImagePermalinkUrl(imageDetail?.permalink_url)
        }
      })
      .catch((error) => {
        console.error("Error fetching image detail:", error)
      })
  }, [editingCreative])

  // Get image when editing
  useEffect(() => {
    if (
      editingCreative &&
      editingCreative.type === "image" &&
      editingCreative.object_story_spec?.link_data?.image_hash
    ) {
      getImageDetail(editingCreative.object_story_spec.link_data.image_hash)
    }
    if (!editingCreative) {
      setImagePermalinkUrl("")
    }
  }, [editingCreative, getImageDetail])

  // 1) Fetch raw creatives
  useEffect(() => {
    if (!effectiveCampaignId) {
      setError("No campaign ID available")
      return
    }

    const fetchRawCreatives = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/fasty-bot/proxy-get-adcreatives?campaignId=${effectiveCampaignId}`,
          {
            headers: {
              "fb-api-key": FB_API_KEY,
            },
          }
        )
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`Failed to fetch raw ad creatives: ${txt}`)
        }
        const data = await res.json()

        const items = data?.data?.data ?? []
        const flattened = items.map((item: any) => ({
          id: item.id,
          name: item.creative.name,
          status: item.creative.status,
          object_type: item.creative.object_type,
          thumbnail_url: item.creative.thumbnail_url,
          video_url: item.creative.video_url,
          object_story_spec: item.creative.object_story_spec,
        })) as RawCreative[]

        setRawCreatives(flattened)
      } catch (err) {
        console.error("Error fetching raw creatives:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load raw creatives"
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchRawCreatives()
  }, [effectiveCampaignId])

  // 2) Fetch metrics & merge - UPDATED to use ad name from metrics
  const fetchMetrics = useCallback(async () => {
    if (!effectiveCampaignId) return
    try {
      const { adCreatives: metricsArray } = await getAllAdMetricsByCampaignId(
        effectiveCampaignId
      )

      const merged = rawCreatives.map((rc) => {
        const match = metricsArray.find((m: any) => m.id === rc.id)
        if (match) {
          return {
            id: rc.id,
            name: match.name, // Use ad name from metrics
            creativeName: rc.name, // Store original creative name
            status: rc.status,
            type: match.type,
            url: rc.thumbnail_url,
            videoId: rc.object_story_spec?.video_data?.video_id,
            object_story_spec: rc.object_story_spec,
            metrics: match.metrics,
          }
        } else {
          const fallbackType: "video" | "image" =
            rc.object_type === "VIDEO" ? "video" : "image"
          return {
            id: rc.id,
            name: rc.name, // Fallback to creative name if no metrics match
            creativeName: rc.name,
            status: rc.status,
            type: fallbackType,
            url: rc.thumbnail_url,
            videoId: rc.object_story_spec?.video_data?.video_id,
            object_story_spec: rc.object_story_spec,
            metrics: {
              impressions: 0,
              reach: 0,
              spend: 0,
              engagement: 0,
              watchTime: 0,
              conversionRate: 0,
              clickThroughRate: 0,
              costPerClick: 0,
              frequency: 0,
              cpp: 0,
              cpm: 0,
              inlineLinkClicks: 0,
              inlineLinkClickRate: 0,
              outboundClicks: 0,
              outboundClickRate: 0,
              uniqueClicks: 0,
              uniqueClickRate: 0,
              websiteCtr: 0,
              leads: 0,
              conversions: 0,
              costPerLead: 0,
              costPerConversion: 0,
              conversionValue: 0,
              roi: 0,
              objective: "",
              optimizationGoal: "",
            },
          }
        }
      })
      setAdCreatives(merged)

      // Only add AI message when not called from server component (which already handles this)
      if (merged.length > 0) {
        try {
          // Import the formatter
          const { formatAdCreativeResults } = await import("@/app/actions/format-campaign-metrics");
          
          // Get the campaign name if available
          const campaignName = merged[0]?.name?.split(' - ')[0] || "your campaign";
          
          // Format the message using our new action
          const formattedMessage = await formatAdCreativeResults(campaignName, merged);
          
          // Submit the message to chat using submitUserMessage (like in campaignresultsnew)
          const resp = await submitUserMessage(formattedMessage, [], true);
          
          // Update the UI state with the new message
          setMessages((old: any[]) => [...old, resp]);
          
          // Also update AI state to maintain compatibility with other code
          const { nanoid } = await import("@/lib/utils");
          setAIState({
            ...aiState,
            messages: [
              ...aiState.messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: formattedMessage,
                timestamp: new Date().toISOString()
              }
            ]
          });
        } catch (err) {
          console.error("Error formatting ad creative results:", err);
          
          // Fallback to basic message if formatting fails
          let msg = `I've analyzed ${merged.length} ad creatives from your campaign.`;
          
          // Add fallback message as AI message
          const { nanoid } = await import("@/lib/utils");
          setAIState({
            ...aiState,
            messages: [
              ...aiState.messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: msg,
                timestamp: new Date().toISOString()
              }
            ]
          });
        }
      }
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
    }
  }, [effectiveCampaignId, rawCreatives, aiState, setAIState, submitUserMessage, setMessages])

  // 3) Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && effectiveCampaignId && rawCreatives.length > 0) {
      initialFetchDone.current = true
      fetchMetrics()
    }
  }, [effectiveCampaignId, rawCreatives, fetchMetrics])

  // 4) Periodic refresh
  useEffect(() => {
    if (!effectiveCampaignId) return
    const intervalId = setInterval(fetchMetrics, CACHE_DURATION)
    return () => clearInterval(intervalId)
  }, [effectiveCampaignId, fetchMetrics, CACHE_DURATION])

  // 5) Slider logic
  const [sliderIndex, setSliderIndex] = useState(0)
  const [metricSection, setMetricSection] = useState(0) // Combined metrics section state 
  const chunkedCreatives = useMemo(() => {
    const sorted = [...adCreatives].sort((a, b) => getPerformanceScore(b) - getPerformanceScore(a))
    const finalChunks: AdCreative[][] = []
    sorted.forEach((c) => finalChunks.push([c]))
    return finalChunks
  }, [adCreatives])

  const handlePrev = () => setSliderIndex((prev) => Math.max(prev - 1, 0))
  const handleNext = () => {
    const maxIndex = chunkedCreatives.length - 1
    setSliderIndex((prev) => (prev < maxIndex ? prev + 1 : prev))
  }

  // Handle viewing creative details
  const handleViewDetails = (creative: AdCreative) => {
    setViewingCreative(creative)
  }

  // Handle editing a creative - UPDATED to use ad name
  const handleEdit = (creative: AdCreative) => {
    setEditingCreative(creative)
    setEditName(creative.name) // Now using ad name
    setEditMessage(
      creative.type === "video"
        ? creative.object_story_spec.video_data?.message || ""
        : creative.object_story_spec.link_data?.message || ""
    )
  }

  // Submit edited creative
  const handleSubmitEdit = async () => {
    if (!editingCreative) return
    setIsEditing(true)
    setEditError(null)

    try {
      const response = await fetch("/api/fasty-bot/proxy-update-adcreative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCreative.id,
          name: editName,
          object_story_spec: {
            ...editingCreative.object_story_spec,
            video_data:
              editingCreative.type === "video" &&
              editingCreative.object_story_spec.video_data
                ? {
                    ...editingCreative.object_story_spec.video_data,
                    message: editMessage,
                  }
                : undefined,
            link_data:
              editingCreative.type === "image" &&
              editingCreative.object_story_spec.link_data
                ? {
                    ...editingCreative.object_story_spec.link_data,
                    message: editMessage,
                    image_url: imagePermalinkUrl,
                    name: editName,
                  }
                : undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update creative")
      }

      const updatedCreative = await response.json()

      // Update the creative in the state
      setAdCreatives((prev) =>
        prev.map((creative) =>
          creative.id === editingCreative.id
            ? {
                ...creative,
                name: editName,
                object_story_spec: {
                  ...creative.object_story_spec,
                  video_data:
                    creative.type === "video" &&
                    creative.object_story_spec.video_data
                      ? {
                          ...creative.object_story_spec.video_data,
                          message: editMessage,
                        }
                      : undefined,
                  link_data:
                    creative.type === "image" && creative.object_story_spec.link_data
                      ? {
                          ...creative.object_story_spec.link_data,
                          message: editMessage,
                          name: editName,
                        }
                      : undefined,
                },
              }
            : creative
        )
      )

      setEditingCreative(null)
    } catch (error) {
      console.error("Error updating creative:", error)
      setEditError("Failed to update creative. Please try again.")
    } finally {
      setIsEditing(false)
    }
  }

  // Toggle active/inactive status of creative
  const togglePublish = async (id: string) => {
    try {
      const creative = adCreatives.find((c) => c.id === id);
      if (!creative) return;

      // Use the toggle status service that communicates with FastAPI
      const result = await toggleAdCreativeStatus(id);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to toggle creative status");
      }

      // Update creative status in state based on the response
      setAdCreatives((prevCreatives) =>
        prevCreatives.map((c) =>
          c.id === id ? { 
            ...c, 
            status: result.new_status || (c.status === "ACTIVE" ? "PAUSED" : "ACTIVE") 
          } : c
        )
      );
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#0A0C14] shadow-lg">
      {/* AI Thought Process Overlay */}
      {showingAiThoughts && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0C14]/95">
          <div className="flex flex-col items-center">
            <div className="mb-8 rounded-full bg-[#4BF29C]/15 p-4">
              <Brain className="size-8 text-[#4BF29C]" />
            </div>
            <div className="w-full max-w-md space-y-3">
              {aiThoughts.map((thought) => (
                <div 
                  key={thought.id} 
                  className={`flex items-center space-x-3 rounded-lg bg-[#151925] p-3 transition-all duration-300 ${
                    completedThoughts.includes(thought.id) 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1D29]">
                    {thought.icon}
                  </div>
                  <span className="text-sm text-[#ADB0B8]">{thought.text}</span>
                  {completedThoughts.includes(thought.id) && (
                    <div className="ml-auto text-[#4BF29C]">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-[#151925] to-[#1A1D29] p-6 text-white border-b border-[#2A2E3A]">
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

        <div className="z-10 flex items-center gap-3">
          <div className="rounded-lg bg-[#4BF29C]/15 p-2">
            <Award className="size-6 text-[#4BF29C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ad Creative Performance</h1>
            <p className="text-sm text-[#ADB0B8]">
              Compare and analyze your ad performance metrics
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="grow overflow-y-auto bg-[#0F1117] p-6">
        {!effectiveCampaignId && (
          <div className="mb-4 rounded-xl border border-[#FF7D5A]/30 bg-[#FF7D5A]/10 p-4">
            <p className="text-[#FF7D5A]">
              No campaign ID provided. Please select a campaign.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-[#FF7D5A]/30 bg-[#FF7D5A]/10 p-4">
            <p className="text-[#FF7D5A]">{error}</p>
          </div>
        )}

        {isLoading && (
          <p className="text-[#ADB0B8]">Loading raw creatives...</p>
        )}

        {adCreatives.length > 0 && !error && (
          <div className="pt-4 pb-8">
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="w-full mb-6 bg-[#151925] text-[#8A8F99]">
                <TabsTrigger value="individual" className="data-[state=active]:bg-[#1A1D29] data-[state=active]:text-white">Individual Creatives</TabsTrigger>
                <TabsTrigger value="combined" className="data-[state=active]:bg-[#1A1D29] data-[state=active]:text-white">Combined Campaign Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="mt-0">
                {/* Original Individual Creatives Content */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handlePrev}
                      variant="outline"
                      size="sm"
                      className="size-10 flex items-center justify-center rounded-full border-[#2A2E3A] p-0 bg-[#151925] hover:bg-[#1A1D29] text-white"
                      disabled={sliderIndex === 0}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <div className="text-sm text-[#8A8F99]">
                      Page {sliderIndex + 1} of {chunkedCreatives.length}
                    </div>
                    <Button
                      onClick={handleNext}
                      variant="outline"
                      size="sm"
                      className="size-10 flex items-center justify-center rounded-full border-[#2A2E3A] p-0 bg-[#151925] hover:bg-[#1A1D29] text-white"
                      disabled={sliderIndex === chunkedCreatives.length - 1}
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>

                  {/* Pagination Dots */}
                  <div className="flex space-x-1">
                    {chunkedCreatives.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSliderIndex(idx)}
                        className={`size-2 rounded-full ${
                          idx === sliderIndex
                            ? "bg-[#4BF29C]"
                            : "bg-[#2A2E3A] hover:bg-[#1A1D29]"
                        }`}
                        aria-label={`Go to page ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative w-full overflow-hidden">
                  <div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
                  >
                    {chunkedCreatives.map((single, idx) => (
                      <div
                        key={idx}
                        className="flex w-full shrink-0 grow-0 justify-center"
                      >
                        {single.map((creative) => {
                          const sortedOverall = [...adCreatives].sort(
                            (a, b) => getPerformanceScore(b) - getPerformanceScore(a)
                          )
                          const topPerformer = sortedOverall[0]?.id
                          const secondBest = sortedOverall[1]?.id
                          return (
                            <CreativeDisplay
                              key={creative.id}
                              creative={creative}
                              isTopPerformer={creative.id === topPerformer}
                              isSecondBest={creative.id === secondBest}
                              onViewDetails={() => handleViewDetails(creative)}
                              onTogglePublish={() => togglePublish(creative.id)}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="combined" className="mt-0">
                <div className="rounded-lg bg-gradient-to-r from-[#151925] to-[#1A1D29] p-6 shadow-lg border border-[#2A2E3A]">
                  <div className="mb-6 flex items-center">
                    <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#4BF29C]/15">
                      <BarChart3 className="size-7 text-[#4BF29C]" />
                    </div>
                    <div className="flex flex-1 justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-white">Campaign Overview</h2>
                        <p className="text-sm text-[#ADB0B8]">
                          Combined results for all {adCreatives.length} creatives
                        </p>
                      </div>
                      
                      {/* Metrics section navigation */}
                      {adCreatives.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-[#8A8F99]">
                            {["Performance Metrics", "Conversion Metrics"][metricSection]} ({metricSection + 1}/2)
                          </div>
                          <Button
                            onClick={() => setMetricSection(prev => (prev > 0 ? prev - 1 : prev))}
                            variant="outline"
                            size="sm"
                            className="size-9 flex items-center justify-center rounded-full border-[#2A2E3A] p-0 bg-[#151925] hover:bg-[#1A1D29] text-white"
                            disabled={metricSection === 0}
                          >
                            <ChevronLeft className="size-5" />
                          </Button>
                          <Button
                            onClick={() => setMetricSection(prev => (prev < 1 ? prev + 1 : prev))}
                            variant="outline"
                            size="sm"
                            className="size-9 flex items-center justify-center rounded-full border-[#2A2E3A] p-0 bg-[#151925] hover:bg-[#1A1D29] text-white"
                            disabled={metricSection === 1}
                          >
                            <ChevronRight className="size-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {adCreatives.length > 0 && (
                    <>
                      {/* Combined metrics display */}
                      {(() => {
                        const combinedMetrics = getCombinedMetrics(adCreatives);
                        
                        // Performance Metrics Section
                        if (metricSection === 0) {
                          return (
                            <div className="rounded-lg bg-[#0A0C14] p-5 shadow-md border border-[#2A2E3A]">
                              <h3 className="mb-4 text-lg font-semibold text-white">Performance Metrics</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <EnhancedMetricItem
                                  icon={<Eye className="size-4 text-[#4AE04A]" />}
                                  label="Impressions"
                                  value={combinedMetrics.impressions.toLocaleString()}
                                  percent={10}
                                  miniChart="sparkline"
                                  isPositive
                                />
                                <EnhancedMetricItem
                                  icon={<Users className="size-4 text-[#4AE04A]" />}
                                  label="Reach"
                                  value={combinedMetrics.reach.toLocaleString()}
                                  percent={8}
                                  miniChart="area"
                                  isPositive
                                />
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Average Frequency
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    {combinedMetrics.frequency.toFixed(2)}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Clicks
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    {combinedMetrics.inlineLinkClicks.toLocaleString()}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Average CTR
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    {combinedMetrics.clickThroughRate.toFixed(2)}%
                                  </p>
                                </div>
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Cost Per Click
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    ${combinedMetrics.costPerClick.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-6 flex justify-end">
                                <Button
                                  onClick={() => setMetricSection(1)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center justify-center gap-2 rounded-full border-[#2A2E3A] bg-[#151925] hover:bg-[#1A1D29] text-white"
                                >
                                  Next: Conversion Metrics <ChevronRight className="size-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        }
                          
                        // Conversion Metrics Section
                        if (metricSection === 1) {
                          return (
                            <div className="rounded-lg bg-[#0A0C14] p-5 shadow-md border border-[#2A2E3A]">
                              <h3 className="mb-4 text-lg font-semibold text-white">Conversion Metrics</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <EnhancedMetricItem
                                  icon={<Target className="size-4 text-[#4AE04A]" />}
                                  label="Total Leads"
                                  value={combinedMetrics.leads.toLocaleString()}
                                  percent={7}
                                  miniChart="bar"
                                  isPositive
                                />
                                <EnhancedMetricItem
                                  icon={<DollarSign className="size-4 text-[#4AE04A]" />}
                                  label="Total Spend"
                                  value={`$${combinedMetrics.spend.toFixed(2)}`}
                                  percent={5}
                                  miniChart="line"
                                  isPositive={false}
                                />
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Conversions
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    {combinedMetrics.conversions.toLocaleString()}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Avg. Conversion Rate
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    {combinedMetrics.conversionRate.toFixed(2)}%
                                  </p>
                                </div>
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Cost Per Lead
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    ${combinedMetrics.costPerLead.toFixed(2)}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                                  <h4 className="text-sm font-medium text-[#ADB0B8]">
                                    Cost Per Conversion
                                  </h4>
                                  <p className="text-2xl font-bold text-white">
                                    ${combinedMetrics.costPerConversion.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-6 flex justify-start">
                                <Button
                                  onClick={() => setMetricSection(0)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center justify-center gap-2 rounded-full border-[#2A2E3A] bg-[#151925] hover:bg-[#1A1D29] text-white"
                                >
                                  <ChevronLeft className="size-4" /> Back
                                </Button>
                              </div>
                            </div>
                          );
                        }
                        
                        
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Details Dialog */}
        <Dialog
          open={!!viewingCreative}
          onOpenChange={(open) => {
            if (!open) {
              setViewingCreative(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0A0C14] border-[#2A2E3A] text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">Creative Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="w-full bg-[#151925] text-[#8A8F99]">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-[#1A1D29] data-[state=active]:text-white">Ad Preview</TabsTrigger>
                  <TabsTrigger value="metrics" className="data-[state=active]:bg-[#1A1D29] data-[state=active]:text-white">Metrics</TabsTrigger>
                  <TabsTrigger value="conversions" className="data-[state=active]:bg-[#1A1D29] data-[state=active]:text-white">Conversion Data</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="pt-4">
                  {viewingCreative && (
                    <>
                      {/* Format selector moved inside preview tab */}
                      <div className="w-full mb-4">
                        <p className="text-sm font-medium text-[#ADB0B8] mb-1">Preview Format</p>
                        <Select 
                          value={adFormat} 
                          onValueChange={setAdFormat}
                        >
                          <SelectTrigger className="w-full bg-[#151925] border-[#2A2E3A] text-[#ADB0B8]">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#151925] border-[#2A2E3A] text-[#ADB0B8]">
                            {(viewingCreative?.type === 'video' ? VIDEO_AD_FORMATS : IMAGE_AD_FORMATS).map((format) => (
                              <SelectItem key={format} value={format}>
                                {AD_FORMAT_LABELS[format as keyof typeof AD_FORMAT_LABELS]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <AdPreview
                        creativeId={viewingCreative.id}
                        type={viewingCreative.type}
                        adFormat={adFormat}
                      />
                    </>
                  )}
                </TabsContent>
                
                {/* METRICS TAB - All metrics moved here from the main card */}
                <TabsContent value="metrics" className="pt-4">
                  {viewingCreative && (
                    <div className="grid grid-cols-2 gap-4">
                      <EnhancedMetricItem
                        icon={<Eye className="size-4 text-[#4AE04A]" />}
                        label="Impressions"
                        value={viewingCreative.metrics.impressions.toLocaleString()}
                        percent={12}
                        miniChart="sparkline"
                      />
                      <EnhancedMetricItem
                        icon={<ThumbsUp className="size-4 text-[#4AE04A]" />}
                        label="Engagement"
                        value={viewingCreative.metrics.engagement.toLocaleString()}
                        percent={8}
                        miniChart="bar"
                        isPositive
                      />
                      <EnhancedMetricItem
                        icon={<Clock className="size-4 text-[#4AE04A]" />}
                        label="Watch Time (s)"
                        value={viewingCreative.metrics.watchTime.toFixed(1)}
                        percent={-5}
                        miniChart="area"
                        isPositive={false}
                      />
                      <EnhancedMetricItem
                        icon={<DollarSign className="size-4 text-[#4AE04A]" />}
                        label="CPC"
                        value={`$${viewingCreative.metrics.costPerClick.toFixed(2)}`}
                        percent={-3}
                        miniChart="line"
                        isPositive
                      />
                      <EnhancedMetricItem
                        icon={<Target className="size-4 text-[#4AE04A]" />}
                        label="Conversions / Leads"
                        value={`${viewingCreative.metrics.conversions}/${viewingCreative.metrics.leads}`}
                        percent={7}
                        miniChart="bar"
                        isPositive
                      />
                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Reach
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {viewingCreative.metrics.reach.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Frequency
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {viewingCreative.metrics.frequency.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Unique Clicks
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {viewingCreative.metrics.uniqueClicks.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* CONVERSIONS TAB */}
                <TabsContent value="conversions" className="pt-4">
                  {viewingCreative && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Conversions
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {viewingCreative.metrics.conversions.toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Leads
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {viewingCreative.metrics.leads.toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Cost Per Lead
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          ${viewingCreative.metrics.costPerLead.toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Cost Per Conversion
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          ${viewingCreative.metrics.costPerConversion.toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Conversion Rate
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {viewingCreative.metrics.conversionRate.toFixed(2)}%
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#151925] p-3 shadow-sm border border-[#2A2E3A]">
                        <h4 className="text-sm font-medium text-[#ADB0B8]">
                          Total Spend
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          ${viewingCreative.metrics.spend.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="pt-4 border-t border-[#2A2E3A]">
              <Button onClick={() => handleEdit(viewingCreative!)} className="mr-2 bg-[#4BF29C] hover:bg-[#4BF29C]/90 text-[#0A0C14]">
                Edit
              </Button>
              <Button onClick={() => setViewingCreative(null)} variant="outline" className="bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingCreative}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCreative(null)
              setEditError(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl bg-[#0A0C14] border-[#2A2E3A] text-white">
            <DialogHeader>
              <DialogTitle>Edit Creative</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <label
                    htmlFor="editName"
                    className="block text-sm font-medium text-[#ADB0B8]"
                  >
                    Name
                  </label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 bg-[#151925] border-[#2A2E3A] text-white"
                  />
                </div>

                <div className="col-span-4">
                  <label
                    htmlFor="editMessage"
                    className="block text-sm font-medium text-[#ADB0B8]"
                  >
                    Message
                  </label>
                  <Textarea
                    id="editMessage"
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    rows={4}
                    className="mt-1 bg-[#151925] border-[#2A2E3A] text-white"
                  />
                </div>
              </div>

              {editError && (
                <div className="rounded-xl bg-[#FF7D5A]/10 p-4 border border-[#FF7D5A]/30">
                  <p className="text-sm text-[#FF7D5A]">{editError}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCreative(null)}
                className="bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmitEdit} 
                disabled={isEditing}
                className="bg-[#4BF29C] hover:bg-[#4BF29C]/90 text-[#0A0C14]"
              >
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default AdCreativesComparison