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
import { CampaignContext } from "@/components/contexts/campaign-context"
import { VideoPlayer } from "@/components/stocks/video-player"

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
} from "lucide-react"

// For Recharts-based charts in the DetailedMetrics tab
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// AI hooking (for forwarding metrics to AI) - silent mode
import { useActions, useAIState, useUIState } from "ai/rsc"

// Import your existing metrics function & types
import { getAllAdMetricsByCampaignId } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"
import type {
  TransformedMetrics,
  TransformedAdCreative,
} from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

//
// 1) No mention of Campaign ID in the header => we simply omit it
//
const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || ""

/**
 * RawCreative represents the shape of the data from /api/fasty-bot/proxy-get-adcreatives
 */
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

/**
 * Our final "merged" creative, storing all metrics from TransformedMetrics
 */
interface AdCreative {
  id: string
  name: string
  type: "image" | "video"
  url?: string
  videoId?: string
  metrics: TransformedMetrics
}

/**
 * A helper function to compute an overall "score" from multiple metrics
 * for deciding which creative is the "Top Performer."
 */
function getPerformanceScore(creative: AdCreative): number {
  const m = creative.metrics
  // watchTime is in seconds, so we can scale it however we like
  return (
    m.engagement * 2 +
    m.impressions * 0.3 +
    m.watchTime * 0.03 + // factor in watchTime
    m.reach * 0.1 -
    m.costPerClick * 5
  )
}

/**
 * The main dashboard component
 */
const AdCreativesComparison: React.FC<{ campaignId?: string }> = ({ campaignId }) => {
  const { campaign } = useContext(CampaignContext)
  const effectiveCampaignId = campaignId || campaign?.id

  // We'll store raw creatives in one state
  const [rawCreatives, setRawCreatives] = useState<RawCreative[]>([])
  // We'll store final merged adCreatives in another state
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs/constants
  const initialFetchDone = useRef(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // AI hooking for silent notifications
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [, setMessages] = useUIState<any>()

  //
  // 1) Fetch raw creatives
  //
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

        // Flatten
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

  //
  // 2) Fetch metrics & merge
  //
  const fetchMetrics = useCallback(async () => {
    if (!effectiveCampaignId) return
    try {
      const { adCreatives: metricsArray } = await getAllAdMetricsByCampaignId(effectiveCampaignId)

      // Merge them
      const merged: AdCreative[] = rawCreatives.map((rc) => {
        const match = metricsArray.find((m: TransformedAdCreative) => m.id === rc.id)

        if (match) {
          // match.type should already be "video" | "image" from your TransformedAdCreative
          return {
            id: rc.id,
            name: rc.name,
            type: match.type,
            url: rc.thumbnail_url,
            videoId: rc.object_story_spec?.video_data?.video_id,
            metrics: match.metrics,
          }
        } else {
          // Fallback: if raw creative is VIDEO => 'video', otherwise => 'image'
          const fallbackType: "video" | "image" =
            rc.object_type === "VIDEO" ? "video" : "image"
          return {
            id: rc.id,
            name: rc.name,
            type: fallbackType,
            url: rc.thumbnail_url,
            videoId: rc.object_story_spec?.video_data?.video_id,
            metrics: {
              impressions: 0,
              reach: 0,
              spend: 0,
              engagement: 0,
              watchTime: 0, // seconds
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

      // AI: silent notifications => pass { silent: true }
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

  //
  // 3) Trigger initial fetch metrics
  //
  useEffect(() => {
    if (!initialFetchDone.current && effectiveCampaignId && rawCreatives.length > 0) {
      initialFetchDone.current = true
      fetchMetrics()
    }
  }, [effectiveCampaignId, rawCreatives, fetchMetrics])

  //
  // 4) Periodic refresh (include CACHE_DURATION in deps to satisfy ESLint)
  //
  useEffect(() => {
    if (!effectiveCampaignId) return
    const intervalId = setInterval(fetchMetrics, CACHE_DURATION)
    return () => clearInterval(intervalId)
  }, [effectiveCampaignId, fetchMetrics, CACHE_DURATION])

  //
  // 5) Slider logic => one creative per chunk
  //
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

  //
  // Render
  //
  return (
    <div className="flex h-full flex-col bg-white shadow-lg dark:bg-zinc-800">
      {/* Header - WITHOUT CAMPAIGN ID */}
      <header className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

        <div className="z-10 flex items-center gap-3">
          <div className="rounded-lg bg-white/20 p-2">
            <Award className="size-6 text-yellow-300" />
          </div>
          <div>
            {/* No ID shown here */}
            <h1 className="text-2xl font-bold">Ad Creative Performance</h1>
            <p className="text-sm text-blue-100">Compare and analyze your ad performance metrics</p>
          </div>
        </div>

        {/* Refresh button */}
        <div className="z-10 flex items-center gap-2">
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
              <TabsTrigger value="overview" className="dark:text-zinc-300 text-zinc-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="detailed" className="dark:text-zinc-300 text-zinc-700">
                Detailed Metrics
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview">
              {/* Slider Controls */}
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
                        // single array has exactly 1 creative
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
              <DetailedMetrics creatives={adCreatives} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

//
// The "CreativeDisplay" with two-column layout
//
interface CreativeDisplayProps {
  creative: AdCreative
  isTopPerformer: boolean
  isSecondBest: boolean
}
const CreativeDisplay: React.FC<CreativeDisplayProps> = ({
  creative,
  isTopPerformer,
  isSecondBest,
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
        hover:scale-105
        ${
          isTopPerformer
            ? "bg-gradient-to-r from-zinc-50 to-yellow-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-yellow-300/50"
            : isSecondBest
            ? "bg-gradient-to-r from-zinc-50 to-blue-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-yellow-300/50"
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
          {creative.name}
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
      </div>
    </div>
  )
}

//
// The EnhancedMetricItem component
//
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
  // Decide pill color
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
        {/* % change pill */}
        <div
          className={`flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClasses}`}
        >
          {isUp ? "↑" : "↓"} {Math.abs(percent)}%
        </div>
      </div>
      <div className="mb-2 text-xl font-semibold text-zinc-800 dark:text-white">{value}</div>

      {/* Mini chart placeholders */}
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

// -------------- DETAILED METRICS --------------

/**
 * Define a union of possible metric keys in TransformedMetrics
 */
type MetricKey = keyof TransformedMetrics
/**
 * A union for categories
 */
type MetricCategory = "engagement" | "costs" | "conversion" | "clicks" | "video"

/**
 * The possible categories must map to actual keys from TransformedMetrics
 */
const metricCategories: Record<MetricCategory, MetricKey[]> = {
  engagement: ["engagement", "impressions", "reach", "frequency"],
  costs: ["spend", "costPerClick", "cpp", "cpm"],
  conversion: ["conversionRate", "clickThroughRate", "inlineLinkClickRate", "outboundClickRate"],
  clicks: ["inlineLinkClicks", "outboundClicks", "uniqueClicks", "uniqueClickRate"],
  video: ["watchTime", "websiteCtr"],
}

const DetailedMetrics: React.FC<{ creatives: AdCreative[] }> = ({ creatives }) => {
  const [metricCategory, setMetricCategory] = useState<MetricCategory>("engagement")
  // selectedMetric must be one of the keys of TransformedMetrics
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("engagement")

  // If user picks a different category, auto-pick the first metric in that category
  useEffect(() => {
    const firstMetric = metricCategories[metricCategory][0]
    setSelectedMetric(firstMetric)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricCategory])

  // Prepare data for the charts
  const chartData = useMemo(() => {
    if (!selectedMetric || !creatives.length) return []
    return creatives.map((cr) => ({
      name: cr.name,
      value: cr.metrics[selectedMetric],
    }))
  }, [selectedMetric, creatives])

  // Decide which chart to show
  const isLineChart =
    metricCategory === "video" || selectedMetric === "watchTime"

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

      {/* Metric selection */}
      <div className="mb-4 flex items-center">
        <span className="mr-2 text-sm text-zinc-600 dark:text-zinc-300">Metric:</span>
        <select
          className="rounded bg-white p-1 text-sm text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
        >
          {metricCategories[metricCategory].map((m) => (
            <option key={m} value={m}>
              {m.replace(/([A-Z])/g, " $1").trim()}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic chart */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md dark:bg-zinc-800">
        <h3 className="mb-4 text-lg font-medium text-zinc-800 dark:text-zinc-100">
          {selectedMetric.replace(/([A-Z])/g, " $1").trim()} Comparison
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            {isLineChart ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" />
                <XAxis dataKey="name" stroke="#444" />
                <YAxis stroke="#444" />
                <Tooltip
                  wrapperStyle={{ backgroundColor: "#1e293b", border: "none" }}
                  labelStyle={{ color: "#cbd5e1" }}
                  contentStyle={{ color: "#fff" }}
                  formatter={(val: number) => val.toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" />
                <XAxis dataKey="name" stroke="#444" />
                <YAxis stroke="#444" />
                <Tooltip
                  wrapperStyle={{ backgroundColor: "#1e293b", border: "none" }}
                  labelStyle={{ color: "#cbd5e1" }}
                  contentStyle={{ color: "#fff" }}
                  formatter={(val: number) => val.toLocaleString()}
                />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md dark:bg-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="dark:bg-zinc-700 bg-zinc-100">
            <tr>
              <th className="p-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Creative
              </th>
              {metricCategories[metricCategory].map((metric) => (
                <th
                  key={metric}
                  className="p-3 text-left font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {metric.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creatives.map((cr) => (
              <tr
                key={cr.id}
                className="border-b border-zinc-200 dark:border-zinc-700"
              >
                <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">{cr.name}</td>
                {metricCategories[metricCategory].map((metric) => (
                  <td key={metric} className="p-3 text-zinc-600 dark:text-zinc-300">
                    {cr.metrics[metric]?.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdCreativesComparison
