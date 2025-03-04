'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { useResizeObserver } from 'usehooks-ts'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'
import {
  Brain,
  TrendingUp,
  DollarSign,
  Target,
  BarChart2,
  PieChart,
  Eye
} from 'lucide-react'
import { Clock as LucideClock } from 'lucide-react'
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

/** Single day's metrics from the historical endpoint */
interface IDailyMetric {
  date: string
  leads?: number
  spend?: number
  cpc?: number
  cpm?: number
  ctr?: number
  impressions?: number
  reach?: number
  frequency?: number
  clicks?: number
  unique_clicks?: number
  cpa?: number
  website_ctr?: number
  post_engagement?: number
  link_clicks?: number
  // Add catch-all for dynamic properties
  [key: string]: number | string | undefined
}

/** Possibly advanced data from the historical endpoint. */
interface IAdvancedMetrics {
  demographics?: Record<string, any>
  platforms?: Record<string, any>
  time_of_day?: Record<string, any>
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
  basic_metrics?: IDailyMetric[]
  daily_metrics?: IDailyMetric[]
  summary?: {
    total_leads: number
    total_spend: number
    total_impressions: number
    total_clicks: number
    total_reach: number
    average_ctr: number
    average_cpc: number
    average_cpm: number
    average_cpa: number
    average_frequency: number
    days_count: number
  }
  advanced_metrics?: IAdvancedMetrics
}

type CampaignObjective = 'OUTCOME_TRAFFIC' | 'OUTCOME_LEADS' | 'OUTCOME_AWARENESS' | string

// ----------------------------------------------------------------
// 2) Utility: Rolling 14-day Change
// ----------------------------------------------------------------
function calcPercentageChange(values: number[], fallbackValues?: number[]): number {
  if (values.length < 14) return 0
  
  const last7 = values.slice(values.length - 7)
  const prev7 = values.slice(values.length - 14, values.length - 7)
  
  const avgLast = last7.reduce((acc, n) => acc + n, 0) / 7
  const avgPrev = prev7.reduce((acc, n) => acc + n, 0) / 7
  
  if (avgPrev === 0) {
    // Try fallback metrics if primary metric is flat
    if (fallbackValues && fallbackValues.length >= 14) {
      return calcPercentageChange(fallbackValues)
    }
    return avgLast > 0 ? 100 : 0
  }
  
  return ((avgLast - avgPrev) / avgPrev) * 100
}

// Add this function after the other utility functions
function getPrimaryMetricsForCampaign(objective: CampaignObjective): Array<{
  title: string
  key: string
  icon: React.ReactNode
  format?: (val: number) => string
  changeKey: string
}> {
  // Define metric configurations by campaign objective
  const primaryMetricMap: Record<string, Array<{
    title: string
    key: string
    icon: React.ReactNode
    format?: (val: number) => string
    changeKey: string
  }>> = {
    "OUTCOME_TRAFFIC": [
      { 
        title: "Total Clicks", 
        key: "total_clicks", 
        icon: <Target className="text-blue-400" />,
        changeKey: "clicks" 
      },
      { 
        title: "Total Spent", 
        key: "total_spend", 
        icon: <DollarSign className="text-green-400" />, 
        format: (val) => `€${val.toFixed(2)}`,
        changeKey: "spend"
      },
      { 
        title: "CTR", 
        key: "average_ctr", 
        icon: <BarChart2 className="text-purple-400" />, 
        format: (val) => `${(val || 0).toFixed(2)}%`,
        changeKey: "ctr"
      },
      { 
        title: "CPC", 
        key: "average_cpc", 
        icon: <TrendingUp className="text-yellow-400" />, 
        format: (val) => `€${(val || 0).toFixed(2)}`,
        changeKey: "cpc"
      }
    ],
    "OUTCOME_LEADS": [
      { 
        title: "Total Leads", 
        key: "total_leads", 
        icon: <TrendingUp className="text-blue-400" />,
        changeKey: "leads"
      },
      { 
        title: "Total Spent", 
        key: "total_spend", 
        icon: <DollarSign className="text-green-400" />, 
        format: (val) => `€${val.toFixed(2)}`,
        changeKey: "spend"
      },
      { 
        title: "CTR", 
        key: "average_ctr", 
        icon: <Target className="text-purple-400" />, 
        format: (val) => `${(val || 0).toFixed(2)}%`,
        changeKey: "ctr"
      },
      { 
        title: "Frequency", 
        key: "average_frequency", 
        icon: <BarChart2 className="text-yellow-400" />, 
        format: (val) => val.toFixed(2),
        changeKey: "frequency"
      }
    ],
    "OUTCOME_AWARENESS": [
      { 
        title: "Impressions", 
        key: "total_impressions", 
        icon: <Eye className="text-blue-400" />,
        changeKey: "impressions"
      },
      { 
        title: "Total Spent", 
        key: "total_spend", 
        icon: <DollarSign className="text-green-400" />, 
        format: (val) => `€${val.toFixed(2)}`,
        changeKey: "spend"
      },
      { 
        title: "CPM", 
        key: "average_cpm", 
        icon: <BarChart2 className="text-purple-400" />, 
        format: (val) => `€${(val || 0).toFixed(2)}`,
        changeKey: "cpm"
      },
      { 
        title: "Frequency", 
        key: "average_frequency", 
        icon: <TrendingUp className="text-yellow-400" />, 
        format: (val) => val.toFixed(2),
        changeKey: "frequency"
      }
    ]
  }
  
  // Default to traffic metrics if objective doesn't match
  return primaryMetricMap[objective] || primaryMetricMap["OUTCOME_TRAFFIC"]
}

// For advanced breakdown - FIXED to handle different campaign types
function parseDemographics(demoObj: Record<string, any>, objective: CampaignObjective) {
  return Object.entries(demoObj).map(([key, val]) => {
    const [ageRange, gender] = key.split('_')
    const result: any = {
      ageRange,
      gender,
      impressions: val.impressions || 0,
      spend: val.spend || 0
    }
    
    // Add the appropriate metrics based on campaign objective
    if (objective === 'OUTCOME_LEADS') {
      result.leads = val.actions || 0
    } else if (objective === 'OUTCOME_TRAFFIC') {
      result.clicks = val.clicks || 0
    }
    
    return result
  })
}

function parsePlatforms(platformObj: Record<string, any>, objective: CampaignObjective) {
  return Object.entries(platformObj).map(([platform, val]) => {
    const result: any = {
      platform,
      impressions: val.impressions || 0,
      spend: val.spend || 0
    }
    
    // Add the appropriate metrics based on campaign objective
    if (objective === 'OUTCOME_LEADS') {
      result.leads = val.actions || 0
    } else if (objective === 'OUTCOME_TRAFFIC') {
      result.clicks = val.clicks || 0
    }
    
    return result
  })
}

function parseTimeOfDay(tObj: Record<string, any>, objective: CampaignObjective) {
  return Object.entries(tObj).map(([hour, val]) => {
    const result: any = {
      hour,
      impressions: val.impressions || 0,
      spend: val.spend || 0
    }
    
    // Add the appropriate metrics based on campaign objective
    if (objective === 'OUTCOME_LEADS') {
      result.leads = val.actions || 0
    } else if (objective === 'OUTCOME_TRAFFIC') {
      result.clicks = val.clicks || 0
    }
    
    return result
  })
}

// ----------------------------------------------------------------
// 3) The Stock Component
// ----------------------------------------------------------------
export function Stock({ campaignId, isActive }: IStockProps) {
  // 3A) AI Tools
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [_, setMessages] = useUIState<any>()

  // 3B) "loaded" state => by default, DO NOT load data
  // If you have a reason to use isActive from outside, you can do:
  // const [loaded, setLoaded] = useState(isActive ?? false)
  const [loaded, setLoaded] = useState<boolean>(false)
  const handleLoadData = useCallback(() => {
    setLoaded(true)
  }, [])

  // aggregator => correct top-level metrics
  const [aggregator, setAggregator] = useState<CampaignSummary | null>(null)
  // historical => daily + advanced
  const [historical, setHistorical] = useState<IHistoricalResponse | null>(null)
  // daily data
  const [dailyMetrics, setDailyMetrics] = useState<IDailyMetric[]>([])
  // advanced breakdown
  const [demographicsData, setDemographicsData] = useState<any[]>([])
  const [platformData, setPlatformData] = useState<any[]>([])
  const [timingData, setTimingData] = useState<any[]>([])

  // Add these state variables
  const [objective, setObjective] = useState<CampaignObjective>('OUTCOME_TRAFFIC')
  const [primaryMetric, setPrimaryMetric] = useState<string>('clicks')

  // We have 3 top-level "tabs"
  const [topView, setTopView] = useState<'overview' | 'extended' | 'dailytable'>('overview')
  // Chart sub-tabs
  const [chartView, setChartView] = useState<'overview' | 'demographics' | 'platforms' | 'timing'>('overview')

  // for chart sizing
  const chartRef = useRef<HTMLDivElement>(null)
  useResizeObserver({ ref: chartRef, box: 'border-box' })

  // 3C) aggregator fetch => only if loaded===true & we have a campaignId
  useEffect(() => {
    if (!loaded || !campaignId) return
    const loadAggregator = async () => {
      try {
        const data = await getCampaignSummary(campaignId)
        setAggregator(data)
        console.log('Aggregator =>', data)

        if (data && data.campaign_id !== '0') {
          // Create a more generic message based on the available metrics
          const metricHighlight = data.total_leads > 0 
            ? `${data.total_leads} leads` 
            : data.clicks > 0 
              ? `${data.clicks} clicks` 
              : `€${data.total_spent.toFixed(2)} spent`;
              
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

  // 3D) historical fetch => only if loaded===true & campaignId
  useEffect(() => {
    if (!loaded || !campaignId) return
    const loadHistorical = async () => {
      try {
        const histData = await getCampaignHistoricalMetrics(campaignId, 'last_year', true)
        setHistorical(histData)
        console.log('Historical =>', histData)

        // daily
        let daily: IDailyMetric[] = []
        if (histData.daily_metrics && histData.daily_metrics.length > 0) {
          daily = histData.daily_metrics
        } else if (histData.basic_metrics && histData.basic_metrics.length > 0) {
          daily = histData.basic_metrics as IDailyMetric[]
        }
        setDailyMetrics(daily)

        // Inside the historical fetch effect, add this code after setting historical data
        if (histData.campaign_details?.objective) {
          setObjective(histData.campaign_details.objective)
          
          // Set primary metric based on campaign objective
          const metricKey = histData.campaign_details.objective === 'OUTCOME_LEADS' 
            ? 'leads'
            : histData.campaign_details.objective === 'OUTCOME_TRAFFIC'
              ? 'clicks'
              : 'impressions'
          setPrimaryMetric(metricKey)
        }

        // advanced - FIXED: now passing objective to parsers
        const adv = histData.advanced_metrics
        const campaignObj = histData.campaign_details?.objective || 'OUTCOME_TRAFFIC'
        if (adv?.demographics) setDemographicsData(parseDemographics(adv.demographics, campaignObj))
        if (adv?.platforms) setPlatformData(parsePlatforms(adv.platforms, campaignObj))
        if (adv?.time_of_day) setTimingData(parseTimeOfDay(adv.time_of_day, campaignObj))
      } catch (err) {
        console.error('Error historical =>', err)
      }
    }
    void loadHistorical()
  }, [loaded, campaignId])

  // 3E) If not loaded => show "Load Data" button
  if (!loaded) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <button
          onClick={handleLoadData}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
        >
          Load Data
        </button>
      </div>
    )
  }

  // 3F) aggregator not loaded => spinner
  if (!aggregator) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <IconSpinner className="size-8 animate-spin text-green-400" />
      </div>
    )
  }

  // 3G) historical not loaded => spinner
  if (!historical) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <IconSpinner className="size-8 animate-spin text-blue-400" />
      </div>
    )
  }

  // Get campaign summary metrics
  const campaignName = aggregator.campaign_name
  const creationDate = aggregator.creation_date
  const status = aggregator.status

  // Get metrics for calculations
  const totalLeads = historical.summary?.total_leads || 0
  const totalSpent = historical.summary?.total_spend || 0
  const totalClicks = historical.summary?.total_clicks || 0
  const totalImpressions = historical.summary?.total_impressions || 0
  const totalReach = historical.summary?.total_reach || 0
  const averageCtr = historical.summary?.average_ctr || 0
  const averageCpc = historical.summary?.average_cpc || 0
  const averageCpm = historical.summary?.average_cpm || 0
  const averageCpa = historical.summary?.average_cpa || 0
  const averageFrequency = historical.summary?.average_frequency || 0

  // aggregator might say daily_budget=1000 => user wants 10 EUR (factor 100)
  const aggregatorDailyBudget = (aggregator as any).daily_budget
    ? (aggregator as any).daily_budget / 100
    : 0

  // Calculate percentage changes for available metrics
  const metricArrays: Record<string, number[]> = {}
  const availableMetrics = ['leads', 'spend', 'clicks', 'impressions', 'ctr', 'cpc', 'cpm', 'reach', 'frequency']

  availableMetrics.forEach(metricKey => {
    metricArrays[metricKey] = dailyMetrics.map(d => (d[metricKey] as number) || 0)
  })

  const metricChanges: Record<string, number> = {}
  availableMetrics.forEach(metricKey => {
    metricChanges[metricKey] = calcPercentageChange(metricArrays[metricKey], metricArrays['spend'])
  })

  // Create chart data based on primary metric
  const chartData = dailyMetrics.map((d) => {
    // Format date for all charts
    const formattedDate = format(new Date(d.date), 'MMM d, yyyy')
    
    // For leads campaigns
    if (objective === 'OUTCOME_LEADS') {
      return {
        date: formattedDate,
        leads: d.leads || 0
      }
    }
    
    // For traffic campaigns
    else if (objective === 'OUTCOME_TRAFFIC') {
      return {
        date: formattedDate,
        clicks: d.clicks || 0
      }
    }
    
    // For awareness campaigns
    else {
      return {
        date: formattedDate,
        impressions: d.impressions || 0
      }
    }
  })

  // Get metric config based on campaign objective
  const metricConfigs = getPrimaryMetricsForCampaign(objective)

  // 3H) top-level display => 3 tabs => overview, extended, dailytable
  let topViewContent: React.ReactNode
  if (topView === 'overview') {
    topViewContent = (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricConfigs.map((config, index) => {
          // Get value from summary if available, otherwise use calculated value
          const summaryValue = historical.summary?.[config.key as keyof typeof historical.summary] || 0
          const displayValue = config.format ? config.format(summaryValue) : summaryValue
          
          return (
            <MetricCard
              key={index}
              title={config.title}
              value={displayValue}
              change={metricChanges[config.changeKey]?.toFixed(1) || '0.0'}
              icon={config.icon}
              subLabel="(past 14 days)"
            />
          )
        })}
      </div>
    )
  } else if (topView === 'extended') {
    // For extended view, show additional metrics based on the campaign type
    let extendedMetrics = []
    
    if (objective === 'OUTCOME_LEADS') {
      extendedMetrics = [
        { label: 'Impressions', value: totalImpressions },
        { label: 'Reach', value: totalReach },
        { label: 'Clicks', value: totalClicks },
        { label: 'Unique Clicks', value: aggregator.unique_clicks || 0 },
        { label: 'Cost/Lead', value: totalLeads > 0 ? `€${(totalSpent / totalLeads).toFixed(2)}` : '-' },
        { label: 'Cost/Click', value: totalClicks > 0 ? `€${(totalSpent / totalClicks).toFixed(2)}` : '-' },
        { label: 'Daily Budget', value: aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : '-' },
      ]
    } else if (objective === 'OUTCOME_TRAFFIC') {
      extendedMetrics = [
        { label: 'Impressions', value: totalImpressions },
        { label: 'Reach', value: totalReach },
        { label: 'Link Clicks', value: dailyMetrics[0]?.link_clicks || 0 },
        { label: 'Post Engagement', value: dailyMetrics[0]?.post_engagement || 0 },
        { label: 'Frequency', value: averageFrequency.toFixed(2) },
        { label: 'Website CTR', value: `${(dailyMetrics[0]?.website_ctr || 0).toFixed(2)}%` },
        { label: 'Daily Budget', value: aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : '-' },
      ]
    } else {
      // Default to awareness metrics
      extendedMetrics = [
        { label: 'CPM', value: `€${averageCpm.toFixed(2)}` },
        { label: 'Frequency', value: averageFrequency.toFixed(2) },
        { label: 'Post Engagement', value: dailyMetrics[0]?.post_engagement || 0 },
        { label: 'CTR', value: `${averageCtr.toFixed(2)}%` },
        { label: 'Clicks', value: totalClicks },
        { label: 'CPC', value: `€${averageCpc.toFixed(2)}` },
        { label: 'Daily Budget', value: aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : '-' },
      ]
    }
    
    topViewContent = (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {extendedMetrics.map((metric, index) => (
          <div key={index} className="bg-zinc-900 p-4 rounded-lg">
            <div className="text-sm text-zinc-400">{metric.label}</div>
            <div className="text-xl font-bold">{metric.value}</div>
          </div>
        ))}
      </div>
    )
  } else {
    // topView === 'dailytable'
    // The entire daily table
    topViewContent = (
      <div className="overflow-auto max-h-[500px] border border-zinc-800 rounded-lg">
        <table className="min-w-max border-collapse text-sm">
          <thead className="bg-zinc-900 sticky top-0">
            <tr>
              <ThCell>Date</ThCell>
              <ThCell>Leads</ThCell>
              <ThCell>Spend</ThCell>
              <ThCell>CPC</ThCell>
              <ThCell>CPM</ThCell>
              <ThCell>CTR</ThCell>
              <ThCell>Impressions</ThCell>
              <ThCell>Reach</ThCell>
              <ThCell>Frequency</ThCell>
              <ThCell>Clicks</ThCell>
              <ThCell>Unique Clicks</ThCell>
              <ThCell>CPA</ThCell>
              <ThCell>Website CTR</ThCell>
              <ThCell>Cost/Video View</ThCell>
              <ThCell>Cost/Link Click</ThCell>
              <ThCell>Cost/Lead</ThCell>
              <ThCell>Cost/Page Engagement</ThCell>
              <ThCell>Cost/Post Save</ThCell>
              <ThCell>Cost/Post Engagement</ThCell>
              <ThCell>Cost/Landing Page</ThCell>
              <ThCell>Cost/Lead (Grouped)</ThCell>
            </tr>
          </thead>
          <tbody>
            {dailyMetrics.map((item, idx) => {
              const dateString = item.date
              return (
                <tr
                  key={idx}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <TdCell>{format(new Date(dateString), 'MMM d, yyyy')}</TdCell>
                  <TdCell>{item.leads || 0}</TdCell>
                  <TdCell>€{(item.spend || 0).toFixed(2)}</TdCell>
                  <TdCell>€{(item.cpc || 0).toFixed(2)}</TdCell>
                  <TdCell>€{(item.cpm || 0).toFixed(2)}</TdCell>
                  <TdCell>{(item.ctr || 0).toFixed(2)}%</TdCell>
                  <TdCell>{item.impressions || 0}</TdCell>
                  <TdCell>{item.reach || 0}</TdCell>
                  <TdCell>{(item.frequency || 0).toFixed(2)}</TdCell>
                  <TdCell>{item.clicks || 0}</TdCell>
                  <TdCell>{item.unique_clicks || 0}</TdCell>
                  <TdCell>€{(item.cpa || 0).toFixed(2)}</TdCell>
                  <TdCell>{(item.website_ctr || 0).toFixed(2)}</TdCell>
                  <TdCell>
                    {item.cost_per_video_view !== undefined
                      ? `€${(item.cost_per_video_view as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item.cost_per_link_click !== undefined
                      ? `€${(item.cost_per_link_click as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item.cost_per_lead !== undefined
                      ? `€${(item.cost_per_lead as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item.cost_per_page_engagement !== undefined
                      ? `€${(item.cost_per_page_engagement as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item['cost_per_onsite_conversion.post_save'] !== undefined
                      ? `€${(item['cost_per_onsite_conversion.post_save'] as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item.cost_per_post_engagement !== undefined
                      ? `€${(item.cost_per_post_engagement as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item.cost_per_landing_page_view !== undefined
                      ? `€${(item.cost_per_landing_page_view as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                  <TdCell>
                    {item['cost_per_onsite_conversion.lead_grouped'] !== undefined
                      ? `€${(item['cost_per_onsite_conversion.lead_grouped'] as number).toFixed(2)}`
                      : '-'}
                  </TdCell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Helper function to get appropriate dataKey for charts based on campaign objective
  const getMetricKeyForCharts = () => {
    if (objective === 'OUTCOME_LEADS') {
      return 'leads'
    } else if (objective === 'OUTCOME_TRAFFIC') {
      return 'clicks'
    } else {
      return 'impressions'
    }
  }

  return (
    <div className="relative min-h-[600px] bg-zinc-950 p-6 text-white space-y-6">
      {/* Header: Campaign Name, date, status, AI button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{campaignName}</div>
          <div className="text-sm text-zinc-400">
            Created: {format(new Date(creationDate), 'MMM d, yyyy HH:mm')}
          </div>
          {/* Show campaign objective */}
          <div className="text-sm text-zinc-400 flex gap-4">
            <span>Campaign Objective: {objective.replace('OUTCOME_', '')}</span>
            <span>Daily Budget: {aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            )}
          >
            {status}
          </div>
          <button
            className="flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400"
            onClick={() => console.log('AI Analysis requested')}
          >
            <Brain size={16} />
            AI Analysis
          </button>
        </div>
      </div>

      {/* The 3 top-level slider tabs: Key Stats, Extended Stats, Daily Table */}
      <div className="flex gap-2 mt-4">
        <button
          className={cn(
            'px-3 py-1 rounded-lg text-sm font-medium',
            topView === 'overview'
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          )}
          onClick={() => setTopView('overview')}
        >
          Key Stats
        </button>
        <button
          className={cn(
            'px-3 py-1 rounded-lg text-sm font-medium',
            topView === 'extended'
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          )}
          onClick={() => setTopView('extended')}
        >
          Extended Stats
        </button>
        <button
          className={cn(
            'px-3 py-1 rounded-lg text-sm font-medium',
            topView === 'dailytable'
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          )}
          onClick={() => setTopView('dailytable')}
        >
          Daily Table
        </button>
      </div>

      {/* Show the content for whichever top-level tab is selected */}
      {topViewContent}

      {/* For the chart area, we only show it if topView is NOT daily table */}
      {topView !== 'dailytable' && (
        <>
          <div className="flex gap-2 mt-6 mb-4">
            <ViewTab
              active={chartView === 'overview'}
              onClick={() => setChartView('overview')}
              icon={<BarChart2 size={16} />}
              label={`Daily ${objective === 'OUTCOME_LEADS' ? 'Leads' : 
                    objective === 'OUTCOME_TRAFFIC' ? 'Clicks' : 'Impressions'}`}
            />
            <ViewTab
              active={chartView === 'demographics'}
              onClick={() => setChartView('demographics')}
              icon={<PieChart size={16} />}
              label="Demographics"
            />
            <ViewTab
              active={chartView === 'platforms'}
              onClick={() => setChartView('platforms')}
              icon={<BarChart2 size={16} />}
              label="Platforms"
            />
            <ViewTab
              active={chartView === 'timing'}
              onClick={() => setChartView('timing')}
              icon={<LucideClock size={16} />}
              label="Timing"
            />
          </div>

          <div className="relative w-full" ref={chartRef} style={{ minHeight: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              {chartView === 'overview' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={getMetricKeyForCharts()}
                    stroke="#34a853"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              ) : chartView === 'demographics' ? (
                <BarChart data={demographicsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey={(item) => `${item.ageRange}_${item.gender}`}
                    stroke="#666"
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar 
                    dataKey={getMetricKeyForCharts()} 
                    fill="#8884d8" 
                  />
                </BarChart>
              ) : chartView === 'platforms' ? (
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="platform" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar 
                    dataKey={getMetricKeyForCharts()} 
                    fill="#82ca9d" 
                  />
                </BarChart>
              ) : (
                <LineChart data={timingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="hour" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={getMetricKeyForCharts()}
                    stroke="#ffa726"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// 4) Helper Sub-Components
// ----------------------------------------------------------------
const ThCell = ({ children }: { children: React.ReactNode }) => (
  <th className="sticky top-0 border-b border-zinc-800 px-3 py-2 text-zinc-300">
    {children}
  </th>
)

const TdCell = ({ children }: { children: React.ReactNode }) => (
  <td className="border-b border-zinc-800 px-3 py-2 text-zinc-200">{children}</td>
)

interface MetricCardProps {
  title: string
  value: string | number
  change: string
  icon: React.ReactNode
  subLabel?: string
}
const MetricCard = ({ title, value, change, icon, subLabel }: MetricCardProps) => {
  const negative = change.startsWith('-')
  return (
    <div className="bg-zinc-900 p-4 rounded-lg">
      <div className="mb-2 flex items-start justify-between">
        <div className="text-sm text-zinc-400">{title}</div>
        {icon}
      </div>
      <div className="mb-1 text-xl font-bold">{value}</div>
      <div className={cn('text-sm', negative ? 'text-red-400' : 'text-green-400')}>
        {change}% {subLabel ?? ''}
      </div>
    </div>
  )
}

interface ViewTabProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}
const ViewTab = ({ active, onClick, icon, label }: ViewTabProps) => (
  <button
    className={cn(
      'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
      active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'
    )}
    onClick={onClick}
  >
    {icon}
    {label}
  </button>
)

/** Optional skeleton */
export const StockSkeleton = () => {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-green-400">
      <div className="float-right inline-block w-fit rounded-full bg-zinc-700 px-2 py-1 text-xs text-transparent">
        xxxxxxx
      </div>
      <div className="mb-1 w-fit rounded-md bg-zinc-700 text-lg text-transparent">
        xxxx xxxx xxxx
      </div>
      <div className="w-fit rounded-md bg-zinc-700 text-3xl font-bold text-transparent">
        xxxx
      </div>
      <div className="text mt-1 w-fit rounded-md bg-zinc-700 text-xs text-transparent">
        xxxxxx xxx xx xxxx xx xxx
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxxxx: xxx
        </div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxxxxxxxxxx: xxx
        </div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxx: xxx
        </div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxxxx: xxx
        </div>
      </div>
      <div className="relative -mx-4 mt-4 cursor-col-resize">
        <div style={{ height: 146 }}></div>
      </div>
    </div>
  )
}