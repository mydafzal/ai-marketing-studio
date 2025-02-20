"use client"

import React, { useState, useEffect, useContext, useMemo } from "react"
import Image from "next/image"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Award, Clock, ThumbsUp, DollarSign, Eye } from "lucide-react"
import { CampaignContext } from "@/components/contexts/campaign-context"
import { VideoPlayer } from "@/components/stocks/video-player"
import { Button } from "@/components/ui/button"

// Import your real data helper from the updated file:
import {
  getAllAdMetricsByCampaignId,
  AdMetricsResponse,
  AdInsight,
} from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

// ==================
// TYPES + INTERFACES
// ==================

interface AdCreative {
  id: string
  name: string
  type: "image" | "video"
  videoId?: string | null
  url?: string
  metrics: {
    impressions: number
    engagement: number
    watchTime: number
    conversionRate: number
    clickThroughRate: number
    costPerClick: number
  }
  performance: {
    weeklyWatchTime: { date: string; minutes: number }[]
  }
  thumbnailPlaceholder: string
}

// (Optional) If you prefer removing this entirely if you're not using it
interface AdCreativesComparisonProps {
  campaignId?: string
}

// For metric items
interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  format?: "number" | "currency" | "percentage" | "duration"
  color: string
}

// ======================================
// UTILITY FUNCTION FOR NUMBER FORMATTING
// ======================================
const formatMetricValue = (
  value: number,
  format: "number" | "currency" | "percentage" | "duration" = "number"
): string => {
  switch (format) {
    case "number":
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value)
    case "percentage":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 1,
      }).format(value / 100)
    case "duration": {
      const hours = Math.floor(value / 60)
      const minutes = Math.floor(value % 60)
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }
    default:
      return String(value)
  }
}

// Small helper to remove trailing 32-char ID
const removeTrailingId = (name: string) => name.replace(/-[a-z0-9]{32}$/, "")

// =================
// METRIC ITEM
// =================
const MetricItem: React.FC<MetricItemProps> = ({
  icon,
  label,
  value,
  format = "number",
  color,
}) => (
  <div className="bg-zinc-50 dark:bg-zinc-700 p-2 rounded-lg transition-all hover:shadow-md">
    <div className="flex items-center space-x-2 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
    </div>
    <div className="text-zinc-800 dark:text-white font-medium">
      {typeof value === "number" ? formatMetricValue(value, format) : value}
    </div>
  </div>
)

// =================
// CREATIVE DISPLAY
// =================
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
  // Decide aspect ratio for 9:16 if it's a video
  const aspectRatioClass = creative.type === "video" ? "aspect-[9/16]" : "aspect-square"

  return (
    <div
      className={`border border-zinc-200 dark:border-zinc-600 group bg-zinc-50 dark:bg-zinc-700 rounded-lg overflow-hidden transition-all hover:shadow-md relative ${
        isTopPerformer
          ? "border-2 border-yellow-400"
          : isSecondBest
          ? "border-2 border-slate-300"
          : ""
      }`}
      style={{ minWidth: "250px" }} // to ensure consistent width for slider
    >
      {/* Media Section */}
      <div className={`relative bg-black w-full ${aspectRatioClass}`}>
        {creative.type === "video" && creative.videoId ? (
          <VideoPlayer
            videoId={creative.videoId}
            className="w-full h-full object-contain"
            height="h-full"
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
        {isTopPerformer ? (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Top Performer</span>
          </div>
        ) : isSecondBest ? (
          <div className="absolute top-2 right-2 bg-gray-300 text-black px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Second Best Performer</span>
          </div>
        ) : null}
      </div>

      {/* Title + Metrics */}
      <div className="p-4">
        <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
          {removeTrailingId(creative.name)}
        </h5>
        {/* 2 columns for the metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            icon={<Eye className="w-4 h-4" />}
            label="Impressions"
            value={creative.metrics.impressions}
            format="number"
            color="text-blue-400"
          />
          <MetricItem
            icon={<ThumbsUp className="w-4 h-4" />}
            label="Engagement"
            value={creative.metrics.engagement}
            format="number"
            color="text-green-400"
          />
          <MetricItem
            icon={<Clock className="w-4 h-4" />}
            label="Watch Time"
            value={creative.metrics.watchTime / 60}
            format="duration"
            color="text-purple-400"
          />
          <MetricItem
            icon={<DollarSign className="w-4 h-4" />}
            label="CPC"
            value={creative.metrics.costPerClick}
            format="currency"
            color="text-yellow-400"
          />
        </div>
      </div>
    </div>
  )
}

// =================
// MAIN COMPONENT
// =================
const AdCreativesComparison: React.FC<AdCreativesComparisonProps> = () => {
  // Using the "CampaignContext" to get the campaign
  const { campaign } = useContext(CampaignContext)

  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Slider state for showcasing 2 creatives side by side in a horizontal slider
  const [sliderIndex, setSliderIndex] = useState(0)
  const perPage = 2

  // Functions to handle slider
  const handlePrev = () => {
    setSliderIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleNext = () => {
    const maxIndex = Math.ceil(adCreatives.length / perPage) - 1
    setSliderIndex((prev) => (prev < maxIndex ? prev + 1 : prev))
  }

  // We'll chunk the creatives in pairs for the slider "slides"
  const chunkedCreatives = useMemo(() => {
    const result = []
    for (let i = 0; i < adCreatives.length; i += 2) {
      result.push(adCreatives.slice(i, i + 2))
    }
    return result
  }, [adCreatives])

  // ==============================================
  // FETCH AD METRICS USING THE campaign.id
  // ==============================================
  useEffect(() => {
    const fetchAdMetrics = async () => {
      if (!campaign?.id) return

      setIsLoading(true)
      setError(null)

      try {
        // 1) Call our helper, which hits the real FastAPI endpoint
        const data = await getAllAdMetricsByCampaignId(campaign.id)

        if (!data?.ads_insights || data.ads_insights.length === 0) {
          setAdCreatives([])
          return
        }

        // 2) Transform each insight into an AdCreative shape
        const finalAdCreatives: AdCreative[] = data.ads_insights.map((insight: AdInsight) => {
          // We'll default to "image" type unless you have logic to detect if it's a video
          const type: "image" | "video" = "image"

          return {
            id: insight.ad_id,
            name: insight.ad_name,
            type,
            videoId: null, // set if you have a real videoId
            url: "",       // if you have a thumbnail or image URL
            metrics: {
              impressions: parseInt(insight.impressions) || 0,
              // "Engagement" = clicks for a simple approach
              engagement: parseInt(insight.clicks) || 0,
              watchTime: 0, // parse from insight if you want
              conversionRate: 0,
              clickThroughRate: parseFloat(insight.ctr) || 0,
              costPerClick: parseFloat(insight.cpc) || 0,
            },
            performance: {
              // Example watchTime data for the line chart
              weeklyWatchTime: [
                { date: "2025-01-01", minutes: 120 },
                { date: "2025-01-08", minutes: 80 },
                { date: "2025-01-15", minutes: 100 },
              ],
            },
            thumbnailPlaceholder: "bg-blue-500",
          }
        })

        setAdCreatives(finalAdCreatives)
      } catch (err) {
        console.error("Error fetching ad metrics:", err)
        setError("Error fetching ad metrics. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdMetrics()
  }, [campaign?.id]) // only re-fetch when campaign.id changes

  // =============================
  // DETERMINE TOP & 2ND BEST (Placeholder logic by highest engagement)
  // =============================
  const sortedAdCreatives = [...adCreatives].sort(
    (a, b) => b.metrics.engagement - a.metrics.engagement
  )
  const topPerformer = sortedAdCreatives[0] || null
  const secondBestPerformer = sortedAdCreatives[1] || null

  // ==============
  // RADAR CHART
  // ==============
  const metrics = [
    "Impressions",
    "Engagement",
    "Watch Time",
    "Conv. Rate",
    "CTR",
    "CPC Efficiency",
  ]

  const radarData = metrics.map((metric) => {
    const dataPoint: { [key: string]: string | number } = { metric }
    adCreatives.forEach((creative) => {
      let value = 0
      switch (metric) {
        case "Impressions":
          value = creative.metrics.impressions / 1000
          break
        case "Engagement":
          value = creative.metrics.engagement / 100
          break
        case "Watch Time":
          value = creative.metrics.watchTime / 100
          break
        case "Conv. Rate":
          value = creative.metrics.conversionRate / 2
          break
        case "CTR":
          value = creative.metrics.clickThroughRate / 2
          break
        case "CPC Efficiency":
          // Example: (1 - (CPC / 5)) * 100
          value = (1 - creative.metrics.costPerClick / 5) * 100
          break
      }
      dataPoint[removeTrailingId(creative.name)] = value
    })
    return dataPoint
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 shadow-lg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            Ad Creative Performance
          </h1>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        {isLoading && <p className="dark:text-zinc-200">Loading ad metrics...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {adCreatives.length > 0 && !isLoading && !error && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Tabs for different analyses */}
            <Tabs defaultValue="creatives" className="w-full">
              <TabsList className="w-full justify-start bg-white dark:bg-zinc-800 border dark:border-zinc-700">
                <TabsTrigger value="creatives" className="text-zinc-700 dark:text-zinc-300">
                  Creative Showcase
                </TabsTrigger>
                <TabsTrigger value="watchtime" className="text-zinc-700 dark:text-zinc-300">
                  Watch Time Analysis
                </TabsTrigger>
                <TabsTrigger value="comparison" className="text-zinc-700 dark:text-zinc-300">
                  Performance Comparison
                </TabsTrigger>
              </TabsList>

              {/* Creative Showcase Tab */}
              <TabsContent value="creatives">
                <div className="flex items-center justify-between mb-4">
                  <Button onClick={handlePrev} variant="default" size="sm">
                    Previous
                  </Button>
                  <Button onClick={handleNext} variant="default" size="sm">
                    Next
                  </Button>
                </div>

                {/* Horizontal slider container */}
                <div className="relative w-full overflow-hidden">
                  <div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
                  >
                    {chunkedCreatives.map((pair, idx) => (
                      <div key={idx} className="w-full shrink-0 grow-0 flex gap-6 justify-center">
                        {pair.map((creative) => (
                          <CreativeDisplay
                            key={creative.id}
                            creative={creative}
                            isTopPerformer={!!topPerformer && creative.id === topPerformer.id}
                            isSecondBest={
                              !!secondBestPerformer && creative.id === secondBestPerformer.id
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Watch Time Analysis Tab */}
              <TabsContent value="watchtime">
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-700 p-4 mt-4">
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                    Watch Time Trends
                  </h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" stroke="#666" allowDuplicatedCategory={false} />
                        <YAxis
                          stroke="#666"
                          tickFormatter={(value) => formatMetricValue(value, "duration")}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", border: "none" }}
                          labelStyle={{ color: "#a1a1aa" }}
                          formatter={(value: any) => formatMetricValue(Number(value), "duration")}
                        />
                        <Legend />
                        {/* Each ad creative gets its own line, referencing its own data array */}
                        {adCreatives.map((creative, index) => (
                          <Line
                            key={creative.id}
                            data={creative.performance.weeklyWatchTime}
                            type="monotone"
                            dataKey="minutes"
                            name={removeTrailingId(creative.name)}
                            stroke={
                              index === 0
                                ? "#3b82f6"
                                : index === 1
                                ? "#8b5cf6"
                                : "#22c55e"
                            }
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              {/* Performance Comparison Tab */}
              <TabsContent value="comparison">
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-700 p-4 mt-4">
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                    Creative Performance Comparison
                  </h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#444" />
                        <PolarAngleAxis dataKey="metric" stroke="#666" tick={{ fill: "#fff" }} />
                        <PolarRadiusAxis stroke="#444" tick={{ fill: "#fff" }} />
                        {adCreatives.map((creative, index) => (
                          <Radar
                            key={creative.id}
                            name={removeTrailingId(creative.name)}
                            dataKey={removeTrailingId(creative.name)}
                            stroke={
                              index === 0
                                ? "#3b82f6"
                                : index === 1
                                ? "#8b5cf6"
                                : "#22c55e"
                            }
                            fill={
                              index === 0
                                ? "#3b82f6"
                                : index === 1
                                ? "#8b5cf6"
                                : "#22c55e"
                            }
                            fillOpacity={0.3}
                          />
                        ))}
                        <Legend />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#18181b", border: "none" }}
                          labelStyle={{ color: "#a1a1aa" }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdCreativesComparison
