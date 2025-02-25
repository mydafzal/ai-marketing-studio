"use client"

import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CampaignContext } from "@/components/contexts/campaign-context"
import { VideoPlayer } from "@/components/stocks/video-player"
import { Badge } from "@/components/ui/badge"

import {
  Award,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  MousePointer,
  Video,
  DollarSign,
  ThumbsUp,
  Eye,
  Clock,
  EyeOff,
  Edit2,
} from "lucide-react"

// AI hooking (for forwarding metrics to AI) - silent mode
import { useActions, useAIState, useUIState } from "ai/rsc"

// Import your existing metrics function & types
import { getAllAdMetricsByCampaignId } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"
import type {
  TransformedMetrics,
  TransformedAdCreative,
} from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

// 1) No mention of Campaign ID in the header => we simply omit it
const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || ""

/**
 * Cleans up creative names by removing date codes and IDs
 * Example format: "Join our Waitlist! 2024-09-26-abcdef"
 */
function formatCreativeName(name: string): string {
  const pattern = /^(.*?)(\s\d{4}-\d{2}-\d{2}-[a-z0-9]+)$/i
  const match = name.match(pattern)
  return match ? match[1] : name
}

/**
 * Update your TransformedMetrics interface to have optional videoMetrics
 * if you haven't already
 */

// RawCreative from your /proxy-get-adcreatives endpoint
interface RawCreative {
  id: string
  name: string
  status: string
  object_type: "VIDEO" | "IMAGE" | "SHARE"
  thumbnail_url?: string
  video_url?: string
  object_story_spec: {
    page_id: string
    video_data?: {
      video_id: string
      title: string
      message: string
      image_url: string
      image_hash: string
    }
    link_data?: {
      name: string
      message: string
      link: string
      image_hash: string
    }
  }
}

// Our final merged creative
interface AdCreative {
  id: string
  name: string
  status: string
  type: "image" | "video"
  url?: string
  videoId?: string
  object_story_spec: any
  metrics: TransformedMetrics
}

/**
 * A helper function to compute an overall "score" from multiple metrics
 * for deciding which creative is the "Top Performer."
 */
function getPerformanceScore(creative: AdCreative): number {
  const m = creative.metrics
  // watchTime is in seconds
  return (
    m.engagement * 2 +
    m.impressions * 0.3 +
    m.watchTime * 0.03 +
    m.reach * 0.1 -
    m.costPerClick * 5
  )
}

/**
 * Gets the best performer ID for a specific metric
 * (For cost metrics, lower is better; for others, higher is better)
 */
function getBestPerformerIdForMetric(creatives: AdCreative[], metric: MetricKey): string {
  if (!creatives.length) return ""
  const costMetrics = ["costPerClick", "cpp", "cpm", "spend"]
  const isLowerBetter = costMetrics.includes(metric)
  return [...creatives].sort((a, b) => {
    return isLowerBetter
      ? a.metrics[metric] - b.metrics[metric]
      : b.metrics[metric] - a.metrics[metric]
  })[0]?.id || ""
}

// Main Dashboard
const AdCreativesComparison: React.FC<{ campaignId?: string }> = ({ campaignId }) => {
  const { campaign } = useContext(CampaignContext)
  const effectiveCampaignId = campaignId || campaign?.id

  const [rawCreatives, setRawCreatives] = useState<RawCreative[]>([])
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for editing creative
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null)
  const [editName, setEditName] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>('')

  const initialFetchDone = useRef(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [, setMessages] = useUIState<any>()

  // Get image details when editing a creative
  const getImageDetail = (imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then(response => response.json())
      .then(imageDetail => {
        if(editingCreative){
          setImagePermalinkUrl(imageDetail?.permalink_url)
        }
      })
      .catch(error => {
        console.error('Error fetching image detail:', error)
      })
  }

  // Get image when editing
  useEffect(() => {
    if (
      editingCreative &&
      editingCreative.type === 'image' &&
      editingCreative.object_story_spec?.link_data?.image_hash
    ) {
      getImageDetail(editingCreative.object_story_spec.link_data.image_hash)
    }
    if(!editingCreative){
      setImagePermalinkUrl('')
    }
  }, [editingCreative])

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
        setError(err instanceof Error ? err.message : "Failed to load raw creatives")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRawCreatives()
  }, [effectiveCampaignId])

  // 2) Fetch metrics & merge
  const fetchMetrics = useCallback(async () => {
    if (!effectiveCampaignId) return
    try {
      const { adCreatives: metricsArray } = await getAllAdMetricsByCampaignId(effectiveCampaignId)

      const merged = rawCreatives.map((rc) => {
        const match = metricsArray.find((m: TransformedAdCreative) => m.id === rc.id)
        if (match) {
          return {
            id: rc.id,
            name: rc.name,
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
            name: rc.name,
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
            },
          }
        }
      })
      setAdCreatives(merged)

      if (merged.length > 0) {
        let msg = `System: We just loaded ${merged.length} ad creatives.`
        merged.forEach((cr, idx) => {
          msg += `\nCreative #${idx + 1}: "${cr.name}" => engagements: ${cr.metrics.engagement}, impressions: ${cr.metrics.impressions}, watchTime: ${cr.metrics.watchTime}s, CPC: ${cr.metrics.costPerClick}`
        })
        await submitUserMessage(msg, [], true, { silent: true })
      }
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
    }
  }, [effectiveCampaignId, rawCreatives, submitUserMessage])

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

  // Handle editing a creative
  const handleEdit = (creative: AdCreative) => {
    setEditingCreative(creative)
    setEditName(creative.name)
    setEditMessage(
      creative.type === "video" 
        ? creative.object_story_spec.video_data?.message || ''
        : creative.object_story_spec.link_data?.message || ''
    )
  }

  // Submit edited creative
  const handleSubmitEdit = async () => {
    if (!editingCreative) return
    setIsEditing(true)
    setEditError(null)

    try {
      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCreative.id,
          name: editName,
          object_story_spec: {
            ...editingCreative.object_story_spec,
            video_data: editingCreative.type === 'video' && editingCreative.object_story_spec.video_data 
              ? { ...editingCreative.object_story_spec.video_data, message: editMessage }
              : undefined,
            link_data: editingCreative.type === 'image' && editingCreative.object_story_spec.link_data
              ? { 
                  ...editingCreative.object_story_spec.link_data, 
                  message: editMessage, 
                  image_url: imagePermalinkUrl,
                  name: editName
                }
              : undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update creative')
      }

      const updatedCreative = await response.json()

      // Update the creative in the state
      setAdCreatives(prev => 
        prev.map(creative => 
          creative.id === editingCreative.id 
            ? { 
                ...creative, 
                name: editName,
                object_story_spec: {
                  ...creative.object_story_spec,
                  video_data: creative.type === 'video' && creative.object_story_spec.video_data
                    ? { ...creative.object_story_spec.video_data, message: editMessage }
                    : undefined,
                  link_data: creative.type === 'image' && creative.object_story_spec.link_data
                    ? { 
                        ...creative.object_story_spec.link_data, 
                        message: editMessage, 
                        name: editName 
                      }
                    : undefined,
                }
              } 
            : creative
        )
      )

      setEditingCreative(null)
    } catch (error) {
      console.error('Error updating creative:', error)
      setEditError('Failed to update creative. Please try again.')
    } finally {
      setIsEditing(false)
    }
  }

  // Toggle active/inactive status of creative
  const togglePublish = async (id: string) => {
    try {
      const creative = adCreatives.find(c => c.id === id)
      if (!creative) return

      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name: creative.name,
          object_story_spec: creative.object_story_spec,
          status: creative.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update creative status')
      }

      const updatedCreative = await response.json()

      // Update creative status in state
      setAdCreatives(prevCreatives =>
        prevCreatives.map(c =>
          c.id === id ? { ...c, status: updatedCreative.status } : c
        )
      )
    } catch (error) {
      console.error('Error toggling publish status:', error)
    }
  }

  // Create new creative handler
  const addNewCreative = async () => {
    const responseMessage = await submitUserMessage(
      'I want to create new ad creative',
      [],
      true
    )
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }

  return (
    <div className="flex h-full flex-col bg-white shadow-lg dark:bg-zinc-800">
      {/* Header */}
      <header className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

        <div className="z-10 flex items-center gap-3">
          <div className="rounded-lg bg-white/20 p-2">
            <Award className="size-6 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ad Creative Performance</h1>
            <p className="text-sm text-blue-100">Compare and analyze your ad performance metrics</p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-2">
          <Button
            onClick={addNewCreative}
            variant="outline" 
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 mr-2"
          >
            <span className="mr-2">+</span>
            New Creative
          </Button>
          <Button
            onClick={fetchMetrics}
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh Data
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="grow overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
        {!effectiveCampaignId && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-yellow-600 dark:text-yellow-400">
              No campaign ID provided. Please select a campaign.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading && <p className="dark:text-zinc-200">Loading raw creatives...</p>}

        {adCreatives.length > 0 && !error && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full justify-start border bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <TabsTrigger value="overview" className="text-zinc-700 dark:text-zinc-300">
                Overview
              </TabsTrigger>
              <TabsTrigger value="detailed" className="text-zinc-700 dark:text-zinc-300">
                Detailed Metrics
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handlePrev}
                    variant="outline"
                    size="sm"
                    className="size-10 flex items-center justify-center rounded-full border-zinc-300 p-0 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
                    disabled={sliderIndex === 0}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Page {sliderIndex + 1} of {chunkedCreatives.length}
                  </div>
                  <Button
                    onClick={handleNext}
                    variant="outline"
                    size="sm"
                    className="size-10 flex items-center justify-center rounded-full border-zinc-300 p-0 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-700"
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
                          ? "bg-blue-500"
                          : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500"
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
                    <div key={idx} className="flex w-full shrink-0 grow-0 justify-center">
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
                            onEdit={() => handleEdit(creative)}
                            onTogglePublish={() => togglePublish(creative.id)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* DETAILED TAB */}
            <TabsContent value="detailed">
              <DetailedMetrics 
                creatives={adCreatives} 
                onEdit={handleEdit}
                onTogglePublish={togglePublish}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Ad Creative</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-5 gap-6 py-4">
            <div className="md:col-span-2 space-y-4">
              {editingCreative?.type === 'video' ? (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <VideoPlayer
                    videoId={editingCreative?.videoId || ''}
                    autoPlay={true}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={imagePermalinkUrl || editingCreative?.url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              
              <div className="px-1">
                <Badge className="mb-2">
                  {editingCreative?.type.toUpperCase()} Ad
                </Badge>
                
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  <p className="mb-1">
                    <span className="font-medium">Status:</span> {editingCreative?.status}
                  </p>
                  <p>
                    <span className="font-medium">Creative ID:</span> {editingCreative?.id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Creative Name
                </label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full"
                  placeholder="Enter creative name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ad Message
                </label>
                <Textarea
                  id="message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full min-h-[150px]"
                  placeholder="Enter your ad copy here..."
                />
              </div>
              
              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                  {editError}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingCreative(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isEditing} className="ml-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// The "CreativeDisplay" with two-column layout
interface CreativeDisplayProps {
  creative: AdCreative
  isTopPerformer: boolean
  isSecondBest: boolean
  onEdit: () => void
  onTogglePublish: () => void
}

const CreativeDisplay: React.FC<CreativeDisplayProps> = ({
  creative,
  isTopPerformer,
  isSecondBest,
  onEdit,
  onTogglePublish
}) => {
  const aspectRatioClass = creative.type === "video" ? "aspect-[9/16]" : "aspect-square"

  return (
    <div
      className={`
        group mx-auto flex max-w-[900px]
        flex-row items-start
        overflow-hidden rounded-xl
        border transition-all duration-300 hover:shadow-xl
        dark:border-zinc-600
        hover:scale-[1.02]
        ${
          isTopPerformer
            ? "bg-gradient-to-r from-zinc-50 to-yellow-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-yellow-300/50"
            : isSecondBest
            ? "bg-gradient-to-r from-zinc-50 to-blue-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-blue-300/50"
            : "bg-white shadow-md dark:bg-zinc-700"
        }
      `}
    >
      {/* LEFT SIDE: Media Container */}
      <div
        className={`
          relative w-1/2 min-h-[300px] max-w-[400px]
          border-r border-zinc-300 dark:border-zinc-600
          bg-black
        `}
      >
        <div className={`relative h-full w-full ${aspectRatioClass}`}>
          {creative.type === "video" ? (
            <VideoPlayer
              videoId={creative.videoId}
              className="size-full object-contain"
              height="h-full"
              key={creative.id}
              autoPlay
              muted
            />
          ) : (
            <Image
              src={creative.url ?? "/placeholder.jpg"}
              alt={creative.name}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            className={`
              text-xs font-medium
              ${creative.status === 'ACTIVE' 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}
            `}
          >
            {creative.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Performance badges */}
        {isTopPerformer && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1 text-black shadow-lg">
            <Award className="size-4" />
            <span className="text-sm font-bold">Top Performer</span>
          </div>
        )}
        {isSecondBest && !isTopPerformer && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 rounded-full bg-gradient-to-r from-slate-300 to-blue-300 px-3 py-1 text-black shadow-lg">
            <Award className="size-4" />
            <span className="text-sm font-bold">Runner Up</span>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Title & stacked metrics */}
      <div className="flex w-1/2 flex-col space-y-4 p-5">
        <h5 className="truncate text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          {formatCreativeName(creative.name)}
        </h5>

        <EnhancedMetricItem
          icon={<Eye className="size-4" />}
          label="Impressions"
          value={creative.metrics.impressions.toLocaleString()}
          percent={12}
          miniChart="sparkline"
        />
        <EnhancedMetricItem
          icon={<ThumbsUp className="size-4" />}
          label="Engagement"
          value={creative.metrics.engagement.toLocaleString()}
          percent={8}
          miniChart="bar"
          isPositive
        />
        <EnhancedMetricItem
          icon={<Clock className="size-4" />}
          label="Watch Time (s)"
          value={creative.metrics.watchTime.toFixed(1)}
          percent={-5}
          miniChart="area"
          isPositive={false}
        />
        <EnhancedMetricItem
          icon={<DollarSign className="size-4" />}
          label="CPC"
          value={`$${creative.metrics.costPerClick.toFixed(2)}`}
          percent={-3}
          miniChart="line"
          isPositive
        />

        {/* Action buttons */}
        <div className="flex pt-2 space-x-2 mt-2 border-t border-zinc-100 dark:border-zinc-600">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit2 className="size-4 mr-1.5" />
            Edit
          </Button>
          <Button
            onClick={onTogglePublish}
            variant={creative.status === 'ACTIVE' ? 'destructive' : 'default'}
            size="sm"
            className={`
              flex-1
              ${creative.status !== 'ACTIVE' && "bg-green-600 hover:bg-green-700"}
            `}
          >
            {creative.status === 'ACTIVE' ? (
              <>
                <EyeOff className="size-4 mr-1.5" />
                Pause
              </>
            ) : (
              <>
                <Eye className="size-4 mr-1.5" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// The EnhancedMetricItem component
interface EnhancedMetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  percent: number
  miniChart: "sparkline" | "bar" | "area" | "line"
  isPositive?: boolean
}
const EnhancedMetricItem: React.FC<EnhancedMetricItemProps> = ({
  icon,
  label,
  value,
  percent,
  miniChart,
  isPositive = true,
}) => {
  const isUp = percent > 0
  const pillClasses = isUp
    ? isPositive
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : isPositive
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md dark:bg-zinc-800">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-500 dark:text-blue-400">{icon}</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
        </div>
        <div
          className={`flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClasses}`}
        >
          {isUp ? "↑" : "↓"} {Math.abs(percent)}%
        </div>
      </div>
      <div className="mb-2 text-xl font-semibold text-zinc-800 dark:text-white">{value}</div>

      {/* Mini chart placeholders (no actual chart) */}
      <div className="flex h-8 w-full items-end overflow-hidden rounded-md bg-slate-100 dark:bg-zinc-700">
        {miniChart === "sparkline" && (
          <div className="flex h-full w-full items-end">
            <div className="h-3/10 w-1/6 bg-blue-400" />
            <div className="h-2/5 w-1/6 bg-blue-400" />
            <div className="h-3/5 w-1/6 bg-blue-400" />
            <div className="h-1/2 w-1/6 bg-blue-400" />
            <div className="h-7/10 w-1/6 bg-blue-400" />
            <div className="h-4/5 w-1/6 bg-blue-400" />
          </div>
        )}
        {miniChart === "bar" && (
          <div className="flex h-full w-full items-end">
            <div className="mx-0.5 h-3/5 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-2/5 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-7/10 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-1/2 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-4/5 w-1/5 bg-indigo-400" />
          </div>
        )}
        {miniChart === "area" && (
          <div className="relative h-full w-full bg-gradient-to-t from-purple-400/30 to-purple-400/5">
            <div className="absolute inset-x-0 bottom-0 h-8 border-t border-purple-400" />
          </div>
        )}
        {miniChart === "line" && (
          <div className="relative h-full w-full">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400" />
          </div>
        )}
      </div>
    </div>
  )
}

// For table row thumbnails
const CreativeThumbnail: React.FC<{ creative?: AdCreative }> = ({ creative }) => {
  const thumbnailSize = 50
  if (!creative) return null

  return (
    <div
      className="relative mr-3 inline-block align-middle overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-600"
      style={{ width: thumbnailSize, height: thumbnailSize }}
    >
      {creative.type === "video" ? (
        <VideoPlayer
          videoId={creative.videoId}
          className="size-full object-cover"
          autoPlay
          muted
          loop
          hideControls
        />
      ) : (
        <Image
          src={creative.url ?? "/placeholder.jpg"}
          alt=""
          width={thumbnailSize}
          height={thumbnailSize}
          className="object-cover"
        />
      )}
    </div>
  )
}

/**
 * The possible categories must map to actual keys from TransformedMetrics
 */
type MetricKey = keyof TransformedMetrics
type MetricCategory = "engagement" | "costs" | "conversion" | "clicks" | "video"
const metricCategories: Record<MetricCategory, MetricKey[]> = {
  engagement: ["engagement", "impressions", "reach", "frequency"],
  costs: ["spend", "costPerClick", "cpp", "cpm"],
  conversion: ["conversionRate", "clickThroughRate", "inlineLinkClickRate", "outboundClickRate"],
  clicks: ["inlineLinkClicks", "outboundClicks", "uniqueClicks", "uniqueClickRate"],
  video: ["watchTime", "websiteCtr"],
}

interface DetailedMetricsProps {
  creatives: AdCreative[]
  onEdit: (creative: AdCreative) => void
  onTogglePublish: (id: string) => void
}

const DetailedMetrics: React.FC<DetailedMetricsProps> = ({ creatives, onEdit, onTogglePublish }) => {
  const [metricCategory, setMetricCategory] = useState<MetricCategory>("engagement")
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("engagement")

  // Auto-pick the first metric if category changes
  useEffect(() => {
    const firstMetric = metricCategories[metricCategory][0]
    setSelectedMetric(firstMetric)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricCategory])

  // Identify best performer
  const bestPerformerId = useMemo(
    () => getBestPerformerIdForMetric(creatives, selectedMetric),
    [creatives, selectedMetric]
  )
  const bestPerformerCreative = useMemo(
    () => creatives.find((cr) => cr.id === bestPerformerId) || null,
    [creatives, bestPerformerId]
  )

  return (
    <div className="mt-4">
      <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
        Detailed Metrics Comparison
      </h2>

      {/* Category tabs */}
      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={metricCategory === "engagement" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("engagement")}
          className="rounded-full"
        >
          <Users className="mr-2 size-4" /> Engagement
        </Button>
        <Button
          variant={metricCategory === "costs" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("costs")}
          className="rounded-full"
        >
          <DollarSign className="mr-2 size-4" /> Cost Metrics
        </Button>
        <Button
          variant={metricCategory === "conversion" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("conversion")}
          className="rounded-full"
        >
          <TrendingUp className="mr-2 size-4" /> Conversion
        </Button>
        <Button
          variant={metricCategory === "clicks" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("clicks")}
          className="rounded-full"
        >
          <MousePointer className="mr-2 size-4" /> Click Data
        </Button>
        <Button
          variant={metricCategory === "video" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("video")}
          className="rounded-full"
        >
          <Video className="mr-2 size-4" /> Video Metrics
        </Button>
      </div>

      {/* Best performer highlight card */}
      {bestPerformerCreative && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 p-4 shadow-md dark:from-yellow-900/20 dark:to-amber-900/20">
          <div className="flex items-center">
            <div className="mr-4 h-20 w-20 overflow-hidden rounded-lg border border-yellow-300 shadow-md">
              {bestPerformerCreative.type === "video" ? (
                <VideoPlayer
                  videoId={bestPerformerCreative.videoId}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  hideControls
                />
              ) : (
                <Image
                  src={bestPerformerCreative.url ?? "/placeholder.jpg"}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <Award className="mr-2 size-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  Top Performer: {formatCreativeName(bestPerformerCreative.name)}
                </h3>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This creative is the top performer for{" "}
                {selectedMetric.replace(/([A-Z])/g, " $1").trim()}:{" "}
                {bestPerformerCreative.metrics[selectedMetric]?.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data table - Wider rows */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md dark:bg-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-700">
            <tr>
              <th className="p-5 text-left font-medium text-zinc-700 dark:text-zinc-300 w-[300px]">
                Creative
              </th>
              {metricCategories[metricCategory].map((metric) => (
                <th
                  key={metric}
                  className="p-5 text-left font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {metric.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
              <th className="p-5 text-center font-medium text-zinc-700 dark:text-zinc-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {creatives.map((cr) => {
              const isBestPerformer = cr.id === bestPerformerId
              return (
                <tr
                  key={cr.id}
                  className={`border-b border-zinc-200 dark:border-zinc-700 ${
                    isBestPerformer ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                  }`}
                >
                  <td className="p-5 font-medium text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center">
                      <CreativeThumbnail creative={cr} />
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="truncate max-w-[200px]">
                            {formatCreativeName(cr.name)}
                          </span>
                          {isBestPerformer && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                              <Award className="mr-1 size-3" />
                              Best
                            </span>
                          )}
                        </div>
                        <Badge 
                          className={`
                            mt-1 text-xs w-fit
                            ${cr.status === 'ACTIVE' 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}
                          `}
                        >
                          {cr.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  {metricCategories[metricCategory].map((metricKey) => (
                    <td
                      key={metricKey}
                      className={`p-5 text-zinc-600 dark:text-zinc-300 ${
                        metricKey === selectedMetric && isBestPerformer
                          ? "font-bold text-green-600 dark:text-green-400"
                          : ""
                      }`}
                    >
                      {cr.metrics[metricKey]?.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  ))}
                  <td className="p-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        onClick={() => onEdit(cr)}
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        onClick={() => onTogglePublish(cr.id)}
                        variant={cr.status === 'ACTIVE' ? 'destructive' : 'default'}
                        size="sm"
                        className={`
                          h-9 px-2.5
                          ${cr.status !== 'ACTIVE' && "bg-green-600 hover:bg-green-700"}
                        `}
                      >
                        {cr.status === 'ACTIVE' ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdCreativesComparison