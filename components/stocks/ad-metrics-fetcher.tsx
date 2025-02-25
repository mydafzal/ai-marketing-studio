"use client"

import React, { useEffect, useState } from "react"
import type { AdInsight } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

interface AdMetricsFetcherProps {
  campaignId: string
  fbApiKey: string
  onMetricsFetched: (insights: AdInsight[]) => void
}

export const AdMetricsFetcher: React.FC<AdMetricsFetcherProps> = ({
  campaignId,
  fbApiKey,
  onMetricsFetched
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!campaignId) {
      setError("No campaign ID provided to AdMetricsFetcher")
      return
    }

    const fetchMetrics = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/fasty-bot/proxy-get-all-ad-metrics-by-campaign-id?campaignId=${campaignId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "fb-api-key": fbApiKey
            }
          }
        )
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch metrics: ${text}`)
        }
        const data = await res.json()

        // data should have { ads_insights: AdInsight[] }
        if (!data?.ads_insights) {
          console.warn("No ads_insights found in the metrics response:", data)
          onMetricsFetched([])
        } else {
          // pass the array up to the parent
          onMetricsFetched(data.ads_insights)
        }
      } catch (err) {
        console.error("Error fetching metrics in AdMetricsFetcher:", err)
        setError(err instanceof Error ? err.message : "Unknown error fetching metrics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [campaignId, fbApiKey, onMetricsFetched])

  if (isLoading) {
    return <p className="dark:text-zinc-200">Loading metrics...</p>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <p className="text-sm text-red-500 mt-2">Campaign ID: {campaignId}</p>
      </div>
    )
  }

  // If no error and no loading, we render nothing
  return null
}
