"use client"

import React, { useState, useEffect, useContext, useMemo } from 'react'
import Image from 'next/image'
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
} from 'recharts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Award, Clock, ThumbsUp, DollarSign, Eye } from 'lucide-react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { VideoPlayer } from '@/components/stocks/video-player'
import { Button } from '@/components/ui/button'

// ==================
// TYPES + INTERFACES
// ==================

interface FetchedCreative {
  id: number
  name: string
  status: string
  object_type: 'VIDEO' | 'IMAGE' | 'SHARE'
  thumbnail_url?: string
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

interface AdsetWithCreatives {
  adset_id: string
  creatives: FetchedCreative[]
}

interface AdCreative {
  id: string
  name: string
  type: 'image' | 'video'
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

interface AdCreativesComparisonProps {
  campaignId?: string
}

// For metric items
interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  format?: 'number' | 'currency' | 'percentage' | 'duration'
  color: string
}

// ======================================
// UTILITY FUNCTION FOR NUMBER FORMATTING
// ======================================
const formatMetricValue = (
  value: number,
  format: 'number' | 'currency' | 'percentage' | 'duration' = 'number'
): string => {
  switch (format) {
    case 'number':
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value)
    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
      }).format(value / 100)
    case 'duration': {
      const hours = Math.floor(value / 60)
      const minutes = Math.floor(value % 60)
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }
    default:
      return String(value)
  }
}

// Small helper to remove trailing 32-char ID (like in the switcher)
const removeTrailingId = (name: string) => name.replace(/-[a-z0-9]{32}$/, '')

// =================
// METRIC ITEM
// =================
const MetricItem: React.FC<MetricItemProps> = ({ icon, label, value, format = 'number', color }) => (
  <div className="bg-zinc-50 dark:bg-zinc-700 p-2 rounded-lg transition-all hover:shadow-md">
    <div className="flex items-center space-x-2 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
    </div>
    <div className="text-zinc-800 dark:text-white font-medium">
      {typeof value === 'number' ? formatMetricValue(value, format) : value}
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
  const aspectRatioClass = creative.type === 'video' ? 'aspect-[9/16]' : 'aspect-square'

  return (
    <div
      className={`border border-zinc-200 dark:border-zinc-600 group bg-zinc-50 dark:bg-zinc-700 rounded-lg overflow-hidden transition-all hover:shadow-md relative ${
        isTopPerformer ? 'border-2 border-yellow-400' : isSecondBest ? 'border-2 border-slate-300' : ''
      }`}
      style={{ minWidth: '250px' }} // to ensure consistent width for slider
    >
      {/* Media Section */}
      <div className={`relative bg-black w-full ${aspectRatioClass}`}>
        {creative.type === 'video' && creative.videoId ? (
          <VideoPlayer
            videoId={creative.videoId}
            className="w-full h-full object-contain"
            height="h-full"
          />
        ) : (
          <Image
            src={creative.url ?? '/placeholder.jpg'}
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
const AdCreativesComparison: React.FC<AdCreativesComparisonProps> = ({ campaignId }) => {
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
  // FETCH REAL AD CREATIVES (similar to switcher)
  // ==============================================
  useEffect(() => {
    const fetchCreatives = async () => {
      if (!campaign?.id) return
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/fasty-bot/proxy-get-adcreatives?campaignId=${campaign.id}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch creatives')
        }

        const data = await response.json()
        // data?.data?.data is an array of { adset_id, creative }
        // We'll group them by adset, then flatten into a single list of FetchedCreative
        const groupedData: AdsetWithCreatives[] = (() => {
          const rawList: any[] = data?.data?.data || []
          const groupObj: Record<string, FetchedCreative[]> = rawList.reduce(
            (acc: Record<string, FetchedCreative[]>, item: any) => {
              const { adset_id, creative } = item
              if (!acc[adset_id]) {
                acc[adset_id] = []
              }
              acc[adset_id].push(creative)
              return acc
            },
            {}
          )
          // convert groupObj to an array
          return Object.entries(groupObj).map(([adsetId, creatives]) => ({
            adset_id: adsetId,
            creatives,
          }))
        })()

        // Now flatten all adsets into one array of FetchedCreative
        const flattened = groupedData.flatMap((group) => group.creatives)

        // Then transform them into the shape AdCreative for analysis (with mock metrics placeholders)
        const finalAdCreatives: AdCreative[] = flattened.map((c) => {
          const isVideo = c.object_type === 'VIDEO'
          const videoId = isVideo ? c.object_story_spec?.video_data?.video_id || null : null
          return {
            id: c.id.toString(),
            name: c.name,
            type: isVideo ? 'video' : 'image',
            videoId,
            url: c.thumbnail_url || '',
            metrics: {
              impressions: 4000, // placeholder
              engagement: 250, // placeholder
              watchTime: 300, // in minutes (placeholder)
              conversionRate: 10, // placeholder
              clickThroughRate: 15, // placeholder
              costPerClick: 1.25, // placeholder
            },
            performance: {
              weeklyWatchTime: [
                { date: '2025-01-01', minutes: 120 },
                { date: '2025-01-08', minutes: 80 },
                { date: '2025-01-15', minutes: 100 },
              ],
            },
            thumbnailPlaceholder: isVideo ? 'bg-purple-500' : 'bg-blue-500',
          }
        })

        setAdCreatives(finalAdCreatives)
      } catch (err) {
        console.error('Error fetching creatives:', err)
        setError('Error fetching creatives. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreatives()
  }, [campaign, campaignId])

  // =============================
  // DETERMINE TOP & 2ND BEST
  // (Placeholder: picks by highest engagement)
  // =============================
  const sortedAdCreatives = [...adCreatives].sort(
    (a, b) => b.metrics.engagement - a.metrics.engagement
  )
  const topPerformer = sortedAdCreatives[0] || null
  const secondBestPerformer = sortedAdCreatives[1] || null

  // ==============
  // RADAR CHART
  // ==============
  const metrics = ['Impressions', 'Engagement', 'Watch Time', 'Conv. Rate', 'CTR', 'CPC Efficiency']
  const radarData = metrics.map((metric) => {
    const dataPoint: { [key: string]: string | number } = { metric }
    adCreatives.forEach((creative) => {
      let value = 0
      switch (metric) {
        case 'Impressions':
          value = creative.metrics.impressions / 1000
          break
        case 'Engagement':
          value = creative.metrics.engagement / 100
          break
        case 'Watch Time':
          value = creative.metrics.watchTime / 100
          break
        case 'Conv. Rate':
          value = creative.metrics.conversionRate / 2
          break
        case 'CTR':
          value = creative.metrics.clickThroughRate / 2
          break
        case 'CPC Efficiency':
          value = (1 - creative.metrics.costPerClick / 5) * 100
          break
      }
      dataPoint[removeTrailingId(creative.name)] = value
    })
    return dataPoint
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 shadow-lg">
      {/* Header (matching switcher style) */}
      <header className="flex items-center justify-between px-6 py-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            Ad Creative Performance
          </h1>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        {isLoading && <p className="dark:text-zinc-200">Loading creatives...</p>}
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
                          tickFormatter={(value) => formatMetricValue(value, 'duration')}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: 'none' }}
                          labelStyle={{ color: '#a1a1aa' }}
                          formatter={(value: any) => formatMetricValue(Number(value), 'duration')}
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
                                ? '#3b82f6'
                                : index === 1
                                ? '#8b5cf6'
                                : '#22c55e'
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
                        <PolarAngleAxis dataKey="metric" stroke="#666" tick={{ fill: '#fff' }} />
                        <PolarRadiusAxis stroke="#444" tick={{ fill: '#fff' }} />
                        {adCreatives.map((creative, index) => (
                          <Radar
                            key={creative.id}
                            name={removeTrailingId(creative.name)}
                            dataKey={removeTrailingId(creative.name)}
                            stroke={
                              index === 0
                                ? '#3b82f6'
                                : index === 1
                                ? '#8b5cf6'
                                : '#22c55e'
                            }
                            fill={
                              index === 0
                                ? '#3b82f6'
                                : index === 1
                                ? '#8b5cf6'
                                : '#22c55e'
                            }
                            fillOpacity={0.3}
                          />
                        ))}
                        <Legend />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: 'none' }}
                          labelStyle={{ color: '#a1a1aa' }}
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
