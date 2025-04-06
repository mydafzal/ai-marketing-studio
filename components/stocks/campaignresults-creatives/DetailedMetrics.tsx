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
      <h2 className="mb-4 text-xl font-semibold text-white">
        Detailed Metrics Comparison
      </h2>

      {/* Category tabs */}
      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={metricCategory === "engagement" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("engagement")}
          className={`rounded-full ${
            metricCategory === "engagement"
              ? "bg-[#4BF29C] text-[#0A0C14] hover:bg-[#4BF29C]/90"
              : "bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
          }`}
        >
          <Users className="mr-2 size-4" /> Engagement
        </Button>
        <Button
          variant={metricCategory === "conversion" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("conversion")}
          className={`rounded-full ${
            metricCategory === "conversion"
              ? "bg-[#4BF29C] text-[#0A0C14] hover:bg-[#4BF29C]/90"
              : "bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
          }`}
        >
          <TrendingUp className="mr-2 size-4" /> Conversion
        </Button>
        <Button
          variant={metricCategory === "clicks" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("clicks")}
          className={`rounded-full ${
            metricCategory === "clicks"
              ? "bg-[#4BF29C] text-[#0A0C14] hover:bg-[#4BF29C]/90"
              : "bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
          }`}
        >
          <MousePointer className="mr-2 size-4" /> Click Data
        </Button>
        <Button
          variant={metricCategory === "video" ? "default" : "outline"}
          size="sm"
          onClick={() => setMetricCategory("video")}
          className={`rounded-full ${
            metricCategory === "video"
              ? "bg-[#4BF29C] text-[#0A0C14] hover:bg-[#4BF29C]/90"
              : "bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
          }`}
        >
          <Video className="mr-2 size-4" /> Video Metrics
        </Button>
      </div>

      {/* Best performer highlight card */}
      {bestPerformerCreative && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-[#151925] to-[#1A1D29] p-4 shadow-md border border-[#2A2E3A]">
          <div className="flex items-center">
            <div className="mr-4 size-20 overflow-hidden rounded-lg border border-[#4BF29C]/30 shadow-md">
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
                <Award className="mr-2 size-5 text-[#4BF29C]" />
                <h3 className="text-lg font-semibold text-white">
                  Top Performer: {formatAdName(bestPerformerCreative.name)}
                </h3>
              </div>
              <p className="text-sm text-[#ADB0B8]">
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
      <div className="overflow-x-auto rounded-xl bg-[#0A0C14] shadow-md border border-[#2A2E3A]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#151925]">
            <tr>
              <th className="w-[300px] p-5 text-left font-medium text-white">
                Creative
              </th>
              {metricCategories[metricCategory].map((metric) => (
                <th
                  key={metric}
                  className="p-5 text-left font-medium text-white"
                >
                  {metric.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
              <th className="p-5 text-center font-medium text-white">
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
                  className={`border-b border-[#2A2E3A] ${
                    isBestPerformer ? "bg-[#151925]" : ""
                  }`}
                >
                  <td className="p-5 font-medium text-white">
                    <div className="flex items-center">
                      <CreativeThumbnail creative={cr} />
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="max-w-[200px] truncate">
                            {formatAdName(cr.name)}
                          </span>
                          {isBestPerformer && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-[#4BF29C]/15 px-2 py-0.5 text-xs font-medium text-[#4BF29C] border border-[#4BF29C]/30">
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
                                ? "bg-[#4BF29C]/15 text-[#4BF29C] border border-[#4BF29C]/30"
                                : "bg-[#1A1D29] text-[#ADB0B8] border border-[#2A2E3A]"
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
                        className={`p-5 text-[#ADB0B8] ${
                          isCurrentAndBest
                            ? "font-bold text-[#4BF29C]"
                            : ""
                        }`}
                      >
                        {formatMetricValue(metricKey, Number(cr.metrics[metricKey]))}
                      </td>
                    )
                  })}
                  <td className="p-5 text-center">
                    <div className="flex justify-center space-x-2">
                      {/* Edit button hidden until editing feature is ready */}
                      {/* <Button
                        onClick={() => onViewDetails(cr)}
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5 bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
                      >
                        <Edit2 className="size-4" />
                      </Button> */}
                      <Button
                        onClick={() => onTogglePublish(cr.id)}
                        variant={cr.status === "ACTIVE" ? "destructive" : "default"}
                        size="sm"
                        className={`
                          h-9 px-2.5
                          ${
                            cr.status === "ACTIVE"
                            ? "bg-[#FF7D5A] hover:bg-[#FF7D5A]/90 text-[#0A0C14]"
                            : "bg-[#4BF29C] hover:bg-[#4BF29C]/90 text-[#0A0C14]"
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