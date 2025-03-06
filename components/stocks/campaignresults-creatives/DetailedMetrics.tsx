"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Users,
  MousePointer,
  Video,
  Award,
  Edit2,
  Eye,
  EyeOff
} from "lucide-react"
import { VideoPlayer } from "@/components/stocks/video-player"
import { CreativeThumbnail } from "./CreativeThumbnail"
import { 
  AdCreative, 
  MetricKey, 
  MetricCategory, 
  getBestPerformerIdForMetric,
  formatAdName 
} from "./types"

// The category to metric key mapping
const metricCategories: Record<MetricCategory, MetricKey[]> = {
  engagement: ["engagement", "impressions", "reach", "frequency"],
  conversion: [
    "conversions",
    "leads",
    "costPerLead",
    "costPerConversion",
    "conversionRate",
    "spend",
  ],
  clicks: ["inlineLinkClicks", "outboundClicks", "uniqueClicks", "uniqueClickRate"],
  video: ["watchTime", "websiteCtr"],
}

interface DetailedMetricsProps {
  creatives: AdCreative[]
  onViewDetails: (creative: AdCreative) => void
  onTogglePublish: (id: string) => void
}

export const DetailedMetrics: React.FC<DetailedMetricsProps> = ({
  creatives,
  onViewDetails,
  onTogglePublish,
}) => {
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

  // Simple helper for displaying certain metrics as percentages without multiplying by 100
  const formatMetricValue = (metricKey: MetricKey, value: number) => {
    // The keys below are presumably stored as "2.09" => 2.09%
    const percentageMetrics: MetricKey[] = [
      "clickThroughRate",
      "uniqueClickRate",
      "inlineLinkClickRate",
      "outboundClickRate",
      "conversionRate",
      "roi",
    ]
    if (percentageMetrics.includes(metricKey)) {
      return `${value.toFixed(2)}%`
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

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
            <div className="mr-4 size-20 overflow-hidden rounded-lg border border-yellow-300 shadow-md">
              {bestPerformerCreative.type === "video" ? (
                <VideoPlayer
                  videoId={bestPerformerCreative.videoId}
                  className="size-full object-cover"
                  autoPlay
                  muted
                />
              ) : (
                <Image
                  src={bestPerformerCreative.url ?? "/placeholder.jpg"}
                  alt=""
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <Award className="mr-2 size-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  Top Performer: {formatAdName(bestPerformerCreative.name)}
                </h3>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This creative is the top performer for{" "}
                {selectedMetric.replace(/([A-Z])/g, " $1").trim()}:{" "}
                {formatMetricValue(
                  selectedMetric,
                  Number(bestPerformerCreative.metrics[selectedMetric])
                )}
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
              <th className="w-[300px] p-5 text-left font-medium text-zinc-700 dark:text-zinc-300">
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
                          <span className="max-w-[200px] truncate">
                            {formatAdName(cr.name)}
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
                            mt-1 w-fit text-xs
                            ${
                              cr.status === "ACTIVE"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                            }
                          `}
                        >
                          {cr.status === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  {metricCategories[metricCategory].map((metricKey) => {
                    const isCurrentAndBest =
                      metricKey === selectedMetric && isBestPerformer
                    return (
                      <td
                        key={metricKey}
                        className={`p-5 text-zinc-600 dark:text-zinc-300 ${
                          isCurrentAndBest
                            ? "font-bold text-green-600 dark:text-green-400"
                            : ""
                        }`}
                      >
                        {formatMetricValue(metricKey, Number(cr.metrics[metricKey]))}
                      </td>
                    )
                  })}
                  <td className="p-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        onClick={() => onViewDetails(cr)}
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        onClick={() => onTogglePublish(cr.id)}
                        variant={cr.status === "ACTIVE" ? "destructive" : "default"}
                        size="sm"
                        className={`
                          h-9 px-2.5
                          ${
                            cr.status !== "ACTIVE" &&
                            "bg-green-600 hover:bg-green-700 text-white"
                          }
                        `}
                      >
                        {cr.status === "ACTIVE" ? (
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