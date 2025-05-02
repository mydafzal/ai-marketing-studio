'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart2,
  Eye
} from 'lucide-react'
import { useActions, useAIState, useUIState } from 'ai/rsc'

import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaignHistoricalMetrics } from '@/lib/api/fasty-bot/helpers/get-campaign-historical-metrics'

// ----------------------------------------------------------------
// 1) Type Definitions
// ----------------------------------------------------------------
interface IStockProps {
  campaignId: string
  /** Fix for the TS error: add this optional prop */
  isActive?: boolean
}

/** Root shape of your historical endpoint's response. */
interface IHistoricalResponse {
  campaign_id: string
  campaign_details?: {
    name: string
    status: string
    start_time?: string
    daily_budget?: number
    lifetime_budget?: number
    objective?: string
  }
  timeline: string
  summary?: {
    average_ctr: number
    average_cpc: number
    average_cpm: number
    average_frequency: number
  }
}

type CampaignObjective = 'OUTCOME_TRAFFIC' | 'OUTCOME_LEADS' | 'OUTCOME_AWARENESS' | string

/**
 * Gibt für jedes Kampagnen-Ziel die primären Metriken zurück,
 * inkl. Format-Funktionen. Hier haben wir den CTR-Fix eingebaut,
 * indem wir val / 100 rechnen.
 */
function getPrimaryMetricsForCampaign(objective: CampaignObjective): Array<{
  title: string
  key: string
  icon: React.ReactNode
  format?: (val: number) => string
  aggregatorKey?: string
}> {
  const primaryMetricMap: Record<string, Array<{
    title: string
    key: string
    icon: React.ReactNode
    format?: (val: number) => string
    aggregatorKey?: string
  }>> = {
    "OUTCOME_TRAFFIC": [
      { 
        title: "Total Clicks", 
        key: "total_clicks", 
        icon: <Target />,
        aggregatorKey: "clicks"
      },
      { 
        title: "Total Spent", 
        key: "total_spend", 
        icon: <DollarSign />, 
        format: (val) => val ? `€${val.toFixed(2)}` : `€0.00`,
        aggregatorKey: "total_spent"
      },
      {
        // Fix: CTR in der API ist bereits ~100x höher => hier /100
        title: "CTR", 
        key: "average_ctr", 
        icon: <BarChart2 />, 
        format: (val) => val ? `${(val / 100).toFixed(2)}%` : `0%`
      },
      { 
        title: "CPC", 
        key: "average_cpc", 
        icon: <TrendingUp />, 
        format: (val) => val ? `€${val.toFixed(2)}` : `€0.00`
      }
    ],
    "OUTCOME_LEADS": [
      { 
        title: "Total Leads", 
        key: "total_leads", 
        icon: <TrendingUp />,
        aggregatorKey: "total_leads"
      },
      { 
        title: "Total Spent", 
        key: "total_spend", 
        icon: <DollarSign />, 
        format: (val) => val ? `€${val.toFixed(2)}` : `€0.00`,
        aggregatorKey: "total_spent"
      },
      {
        // Fix: CTR in der API ist bereits ~100x höher => hier /100
        title: "CTR", 
        key: "average_ctr", 
        icon: <Target />, 
        format: (val) => val ? `${(val / 100).toFixed(2)}%` : `0%`
      },
      { 
        title: "Frequency", 
        key: "average_frequency", 
        icon: <BarChart2 />, 
        format: (val) => val ? val.toFixed(2) : "0"
      }
    ],
    "OUTCOME_AWARENESS": [
      { 
        title: "Impressions", 
        key: "total_impressions", 
        icon: <Eye />
      },
      { 
        title: "Total Spent", 
        key: "total_spend", 
        icon: <DollarSign />, 
        format: (val) => val ? `€${val.toFixed(2)}` : `€0.00`,
        aggregatorKey: "total_spent"
      },
      { 
        title: "CPM", 
        key: "average_cpm", 
        icon: <BarChart2 />, 
        format: (val) => val ? `€${val.toFixed(2)}` : `€0.00`
      },
      { 
        title: "Frequency", 
        key: "average_frequency", 
        icon: <TrendingUp />, 
        format: (val) => val ? val.toFixed(2) : "0"
      }
    ]
  }

  // Default zu "OUTCOME_TRAFFIC", falls keines passt
  return primaryMetricMap[objective] || primaryMetricMap["OUTCOME_TRAFFIC"]
}

// ----------------------------------------------------------------
// 3) The Stock Component
// ----------------------------------------------------------------
export function Stock({ campaignId, isActive }: IStockProps) {
  // AI Tools
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [_, setMessages] = useUIState<any>()

  // "loaded"-Zustand
  const [loaded, setLoaded] = useState<boolean>(false)
  const handleLoadData = useCallback(() => {
    setLoaded(true)
  }, [])

  // aggregator => obere Metriken
  const [aggregator, setAggregator] = useState<CampaignSummary | null>(null)
  // historical => campaign details + averages
  const [historical, setHistorical] = useState<IHistoricalResponse | null>(null)

  // objective
  const [objective, setObjective] = useState<CampaignObjective>('OUTCOME_TRAFFIC')

  // 3C) aggregator fetch => nur wenn loaded===true und campaignId
  useEffect(() => {
    if (!loaded || !campaignId) return

    const loadAggregator = async () => {
      try {
        const data = await getCampaignSummary(campaignId)
        setAggregator(data)
        console.log('Aggregator =>', data)

        if (data && data.campaign_id !== '0') {
          const metricHighlight = data.total_leads > 0 
            ? `${data.total_leads} leads` 
            : data.clicks > 0 
              ? `${data.clicks} clicks` 
              : `€${data.total_spent.toFixed(2)} spent`
          
          const msg = `System: aggregator loaded for campaign '${data.campaign_name}'. It has ${metricHighlight}.`
          const resp = await submitUserMessage(msg, [], true)
          setMessages((old: any[]) => [...old, resp])
        }
      } catch (err) {
        console.error('Error aggregator =>', err)
      }
    }
    void loadAggregator()
  }, [loaded, campaignId, submitUserMessage, setMessages])

  // 3D) historical fetch => nur wenn loaded===true und campaignId
  useEffect(() => {
    if (!loaded || !campaignId) return

    const loadHistorical = async () => {
      try {
        const histData = await getCampaignHistoricalMetrics(campaignId, 'last_year', true)
        setHistorical(histData)
        console.log('Historical =>', histData)

        // objective aus campaign_details
        if (histData.campaign_details?.objective) {
          setObjective(histData.campaign_details.objective)
        }

      } catch (err) {
        console.error('Error historical =>', err)
      }
    }
    void loadHistorical()
  }, [loaded, campaignId])

  // Wenn nicht geladen => Button
  if (!loaded) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#0A0C14] rounded-xl border border-[#2A2E3A]">
        <button
          onClick={handleLoadData}
          className="flex items-center gap-2 rounded-lg bg-[#4BF29C] px-6 py-3 font-medium text-[#0A0C14] hover:bg-[#3AD88C] transition-colors"
        >
          Load Data
        </button>
      </div>
    )
  }

  // aggregator noch nicht da => Spinner
  if (!aggregator) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#0A0C14] rounded-xl border border-[#2A2E3A]">
        <IconSpinner className="size-8 animate-spin text-[#4BF29C]" />
      </div>
    )
  }

  // historical nicht da => Spinner
  if (!historical) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#0A0C14] rounded-xl border border-[#2A2E3A]">
        <IconSpinner className="size-8 animate-spin text-[#4BF29C]" />
      </div>
    )
  }

  // Zusammenfassung
  const campaignName = aggregator.campaign_name
  const creationDate = aggregator.creation_date
  const status = aggregator.status

  // Budget-Fix
  const aggregatorDailyBudget = (aggregator as any).daily_budget
    ? (aggregator as any).daily_budget / 100
    : 0

  // MetricConfigs
  const metricConfigs = getPrimaryMetricsForCampaign(objective)

  return (
    <div className="relative bg-[#1A1D29] p-6 text-white space-y-6 rounded-xl border border-[#2A2E3A]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-white">{campaignName}</div>
          <div className="text-sm text-[#ADB0B8]">
            Created: {format(new Date(creationDate), 'MMM d, yyyy HH:mm')}
          </div>
          <div className="text-sm text-[#ADB0B8] flex gap-4">
            <span>Campaign Objective: {objective.replace('OUTCOME_', '')}</span>
            <span>Daily Budget: {aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'rounded-full px-3 py-1 text-sm flex items-center',
              status === 'ACTIVE'
                ? 'bg-[#151925] text-[#4BF29C] border border-[#2A2E3A]'
                : 'bg-[#151925] text-[#FF7D5A] border border-[#2A2E3A]'
            )}
          >
            <div className={cn(
              'w-2 h-2 rounded-full mr-2',
              status === 'ACTIVE' ? 'bg-[#4BF29C]' : 'bg-[#FF7D5A]'
            )}></div>
            {status}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {metricConfigs.map((config, index) => {
          let displayValue: string | number;
          
          // Use aggregator data when available
          if (config.aggregatorKey && (aggregator as any)[config.aggregatorKey] !== undefined) {
            const aggValue = (aggregator as any)[config.aggregatorKey];
            displayValue = config.format ? config.format(aggValue) : aggValue;
          } else {
            // Fallback to historical data
            const summaryValue = historical.summary?.[config.key as keyof typeof historical.summary] || 0;
            displayValue = config.format ? config.format(summaryValue) : summaryValue;
          }

          return (
            <MetricCard
              key={index}
              title={config.title}
              value={displayValue}
              icon={config.icon}
            />
          )
        })}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// 4) Helper Sub-Components
// ----------------------------------------------------------------
// Interface for MetricCard component props
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

const MetricCard = ({ title, value, icon }: MetricCardProps) => {
  return (
    <div className="bg-[#0A0C14] p-4 rounded-lg border border-[#2A2E3A]">
      <div className="mb-2 flex items-start justify-between">
        <div className="text-sm text-[#8A8F99]">{title}</div>
        <div className="text-[#4BF29C]">{icon}</div>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  )
}

/** Optional skeleton */
export const StockSkeleton = () => {
  return (
    <div className="rounded-xl border border-[#2A2E3A] bg-[#1A1D29] p-4 text-[#4BF29C]">
      <div className="float-right inline-block w-fit rounded-full bg-[#151925] px-2 py-1 text-xs text-transparent">
        xxxxxxx
      </div>
      <div className="mb-1 w-fit rounded-md bg-[#151925] text-lg text-transparent">
        xxxx xxxx xxxx
      </div>
      <div className="w-fit rounded-md bg-[#151925] text-3xl font-bold text-transparent">
        xxxx
      </div>
      <div className="text mt-1 w-fit rounded-md bg-[#151925] text-xs text-transparent">
        xxxxxx xxx xx xxxx xx xxx
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="w-full rounded-md bg-[#151925] text-sm text-transparent">
          xxxxx: xxx
        </div>
        <div className="w-full rounded-md bg-[#151925] text-sm text-transparent">
          xxxxxxxxxxx: xxx
        </div>
        <div className="w-full rounded-md bg-[#151925] text-sm text-transparent">
          xxx: xxx
        </div>
        <div className="w-full rounded-md bg-[#151925] text-sm text-transparent">
          xxxxx: xxx
        </div>
      </div>
    </div>
  )
}