"use client"

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
import { Award, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { CampaignContext } from "@/components/contexts/campaign-context"

// AI hooking (for forwarding metrics to AI) - silent mode
import { useActions, useAIState, useUIState } from "ai/rsc"
import { Message } from "ai"

// Import your existing metrics function & types
import { getAllAdMetricsByCampaignId } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

// Import sub-components
import { DetailedMetrics } from "./DetailedMetrics"
import { CreativeDisplay } from "./CreativeDisplay"
import { AdCreative, RawCreative, getPerformanceScore } from "./types"

const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || ""

// Main Dashboard
const AdCreativesComparison: React.FC<{ campaignId?: string }> = ({
  campaignId,
}) => {
  const { campaign } = useContext(CampaignContext)
  const effectiveCampaignId = campaignId || campaign?.id

  const [rawCreatives, setRawCreatives] = useState<RawCreative[]>([])
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for viewing creative details
  const [viewingCreative, setViewingCreative] = useState<AdCreative | null>(null)

  // State for editing creative
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null)
  const [editName, setEditName] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>("")

  const initialFetchDone = useRef(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [, setMessages] = useUIState<any>()

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

      if (merged.length > 0) {
        let msg = `System: We just loaded ${merged.length} ad creatives.`
        merged.forEach((cr, idx) => {
          msg += `\nCreative #${idx + 1}: "${cr.name}" => engagements: ${
            cr.metrics.engagement
          }, impressions: ${
            cr.metrics.impressions
          }, watchTime: ${cr.metrics.watchTime}s, CPC: ${
            cr.metrics.costPerClick
          }`
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
      const creative = adCreatives.find((c) => c.id === id)
      if (!creative) return

      const response = await fetch("/api/fasty-bot/proxy-update-adcreative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: creative.name,
          object_story_spec: creative.object_story_spec,
          status: creative.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update creative status")
      }

      const updatedCreative = await response.json()

      // Update creative status in state
      setAdCreatives((prevCreatives) =>
        prevCreatives.map((c) =>
          c.id === id ? { ...c, status: updatedCreative.status } : c
        )
      )
    } catch (error) {
      console.error("Error toggling publish status:", error)
    }
  }

  // Create new creative handler
  const addNewCreative = async () => {
    const responseMessage = await submitUserMessage(
      "I want to create new ad creative",
      [],
      true
    )
    setMessages((currentMessages: Message[]) => [...currentMessages, responseMessage])
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
            <p className="text-sm text-blue-100">
              Compare and analyze your ad performance metrics
            </p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-2">
          <Button
            onClick={addNewCreative}
            variant="outline"
            size="sm"
            className="mr-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
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

        {isLoading && (
          <p className="dark:text-zinc-200">Loading raw creatives...</p>
        )}

        {adCreatives.length > 0 && !error && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full justify-start border bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <TabsTrigger
                value="overview"
                className="text-zinc-700 dark:text-zinc-300"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="detailed"
                className="text-zinc-700 dark:text-zinc-300"
              >
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

            {/* DETAILED TAB */}
            <TabsContent value="detailed">
              <DetailedMetrics
                creatives={adCreatives}
                onViewDetails={handleViewDetails}
                onTogglePublish={togglePublish}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Details Dialog */}
      <Dialog
        open={!!viewingCreative}
        onOpenChange={(open) => {
          if (!open) {
            setViewingCreative(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Creative Details</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-5 gap-6 py-4">
            <div className="md:col-span-2 space-y-4">
              {viewingCreative?.type === "video" ? (
                <div className="overflow-hidden rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <VideoPlayer
                    videoId={viewingCreative?.videoId || ""}
                    autoPlay={true}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="aspect-square overflow-hidden rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                  <img
                    src={viewingCreative?.url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <div className="px-1">
                <Badge className="mb-2">
                  {viewingCreative?.type.toUpperCase()} Ad
                </Badge>

                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  <p className="mb-1">
                    <span className="font-medium">Name:</span>{" "}
                    {viewingCreative?.name}
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Status:</span>{" "}
                    {viewingCreative?.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
                  <TabsTrigger value="conversions">Conversion Data</TabsTrigger>
                </TabsList>

                {/* METRICS TAB */}
                <TabsContent value="metrics" className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Impressions
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.impressions.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Engagement
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.engagement.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Reach
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.reach.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Watch Time (s)
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.watchTime.toFixed(1)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Cost Per Click
                      </h4>
                      <p className="text-2xl font-bold">
                        ${viewingCreative?.metrics.costPerClick.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Click-Through Rate
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.clickThroughRate.toFixed(2)}%
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Frequency
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.frequency.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Unique Clicks
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.uniqueClicks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* CONVERSIONS TAB */}
                <TabsContent value="conversions" className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Conversions
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.conversions.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Leads
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.leads.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Cost Per Lead
                      </h4>
                      <p className="text-2xl font-bold">
                        ${viewingCreative?.metrics.costPerLead.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Cost Per Conversion
                      </h4>
                      <p className="text-2xl font-bold">
                        ${viewingCreative?.metrics.costPerConversion.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Conversion Rate
                      </h4>
                      <p className="text-2xl font-bold">
                        {viewingCreative?.metrics.conversionRate.toFixed(2)}%
                      </p>
                    </div>

                    <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Total Spend
                      </h4>
                      <p className="text-2xl font-bold">
                        ${viewingCreative?.metrics.spend.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => handleEdit(viewingCreative!)} className="mr-2">
              Edit
            </Button>
            <Button onClick={() => setViewingCreative(null)}>Close</Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Creative</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <label
                  htmlFor="editName"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Name
                </label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="col-span-4">
                <label
                  htmlFor="editMessage"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Message
                </label>
                <Textarea
                  id="editMessage"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            {editError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{editError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCreative(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitEdit} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdCreativesComparison