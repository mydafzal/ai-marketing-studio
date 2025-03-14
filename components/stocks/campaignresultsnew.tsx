/* eslint-disable react-hooks/exhaustive-deps */
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
  inline_link_clicks?: number
  outbound_clicks?: number
  conversions?: number
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

type CampaignObjective = 
  | 'OUTCOME_AWARENESS'    // Awareness
  | 'OUTCOME_TRAFFIC'      // Traffic
  | 'OUTCOME_ENGAGEMENT'   // Engagement
  | 'OUTCOME_LEADS'        // Leads
  | 'OUTCOME_APP_PROMOTION' // App Promotion
  | 'OUTCOME_SALES'        // Sales/Conversions
  | string

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
  changeKey: string
}> {
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
        // CTR displayed as-is from API
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
        // CTR displayed as-is from API
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

  // Default zu "OUTCOME_TRAFFIC", falls keines passt
  return primaryMetricMap[objective] || primaryMetricMap["OUTCOME_TRAFFIC"]
}

/**
 * Get the appropriate metric name based on campaign objective
 */
function getMetricNameForObjective(objective: CampaignObjective): string {
  switch (objective) {
    case 'OUTCOME_LEADS': return 'Leads';
    case 'OUTCOME_TRAFFIC': return 'Clicks';
    case 'OUTCOME_AWARENESS': return 'Reach';
    case 'OUTCOME_ENGAGEMENT': return 'Engagements';
    case 'OUTCOME_APP_PROMOTION': return 'App Installs';
    case 'OUTCOME_SALES': return 'Conversions';
    default: return 'Impressions';
  }
}

/**
 * Format a platform name for display - converts snake_case to Title Case
 * and removes duplicate words
 */
function formatPlatformName(platform: string): string {
  // First, split by underscores
  const parts = platform.split('_');
  
  // Remove duplicates in sequence
  const deduplicatedParts = parts.filter((part, index) => {
    return index === 0 || part !== parts[index - 1];
  });
  
  // Now capitalize each word
  return deduplicatedParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get emoji for platform - empty implementation as requested
 */
function getPlatformEmoji(platform: string): string {
  return '';
}

/**
 * Format a demographic segment for display
 */
function formatDemographic(ageRange: string, gender: string): string {
  const genderDisplay = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  return `${ageRange} (${genderDisplay})`;
}

/**
 * Format hour for display
 */
function formatHour(hour: string): string {
  const hourNum = parseInt(hour);
  // Create a formatted time string
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const hourDisplay = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hourDisplay}:00 ${ampm}`;
}

/**
 * Enhanced parsing function for demographics data that works with all campaign types
 */
function parseDemographics(demoObj: Record<string, any>, objective: CampaignObjective) {
  const metricName = getMetricNameForObjective(objective);
  
  return Object.entries(demoObj).map(([key, val]) => {
    const [ageRange, gender] = key.split('_')
    // Format for display
    const displayLabel = formatDemographic(ageRange, gender);
    
    const result: any = {
      ageRange,
      gender,
      label: key,
      displayLabel,
      impressions: val.impressions || 0,
      reach: val.reach || 0,
      spend: val.spend || 0,
      // Add metric name for tooltip display
      metricName: metricName
    }
    
    // Store all available metrics
    if (val.leads) result.leads = val.leads || 0;
    if (val.clicks) result.clicks = val.clicks || 0;
    if (val.actions) result.actions_original = val.actions || 0;
    if (val.video_views) result.video_views = val.video_views || 0;
    if (val.app_installs) result.app_installs = val.app_installs || 0;
    if (val.purchases) result.purchases = val.purchases || 0;
    if (val.engagement || val.post_engagement) result.engagement = val.engagement || val.post_engagement || 0;
    if (val.inline_link_clicks) result.inline_link_clicks = val.inline_link_clicks || 0;
    if (val.outbound_clicks) result.outbound_clicks = val.outbound_clicks || 0;
    if (val.conversions) result.conversions = val.conversions || 0;
    
    // Set the appropriate primary metric based on campaign objective
    // Also populate actions field for chart display
    switch (objective) {
      case 'OUTCOME_LEADS':
        result.leads = val.actions || 0;
        result.actions = val.actions || 0;
        break;
      case 'OUTCOME_TRAFFIC':
        result.clicks = val.clicks || 0;
        result.actions = val.clicks || 0;
        break;
      case 'OUTCOME_AWARENESS':
        // Use reach instead of impressions for awareness campaigns
        result.reach = val.reach || 0;
        result.actions = val.reach || val.impressions || 0;
        break;
      case 'OUTCOME_ENGAGEMENT':
        // For engagement campaigns, combine inbound and outbound clicks
        const inboundClicks = val.inline_link_clicks || 0;
        const outboundClicks = val.outbound_clicks || 0;
        const totalEngagement = inboundClicks + outboundClicks || val.engagement || val.post_engagement || 0;
        
        result.combined_clicks = totalEngagement;
        result.actions = totalEngagement > 0 ? totalEngagement : val.impressions || 0;
        break;
      case 'OUTCOME_APP_PROMOTION':
        result.app_installs = val.app_installs || val.actions || 0;
        result.actions = val.app_installs || val.actions || 0;
        break;
      case 'OUTCOME_SALES':
        // Combine conversions and purchases for sales campaigns
        const conversions = val.conversions || 0;
        const purchases = val.purchases || 0;
        const combinedSales = conversions + purchases || val.actions || 0;
        
        result.combined_sales = combinedSales;
        result.actions = combinedSales;
        break;
      default:
        // Fallback for any other or unknown campaign type
        result.impressions = val.impressions || 0;
        result.actions = val.impressions || 0;
    }
    return result
  })
}

/**
 * Enhanced parsing function for platforms data that works with all campaign types
 */
function parsePlatforms(platformObj: Record<string, any>, objective: CampaignObjective) {
  const metricName = getMetricNameForObjective(objective);
  
  return Object.entries(platformObj).map(([platform, val]) => {
    // Format the platform name for display
    const formattedName = formatPlatformName(platform);
    
    const result: any = {
      platform,
      label: platform,
      // Nice display name for hover card
      displayLabel: formattedName,
      impressions: val.impressions || 0,
      reach: val.reach || 0,
      spend: val.spend || 0,
      // Add metric name for tooltip display
      metricName: metricName
    }
    
    // Store all available metrics
    if (val.leads) result.leads = val.leads || 0;
    if (val.clicks) result.clicks = val.clicks || 0;
    if (val.actions) result.actions_original = val.actions || 0;
    if (val.video_views) result.video_views = val.video_views || 0;
    if (val.app_installs) result.app_installs = val.app_installs || 0;
    if (val.purchases) result.purchases = val.purchases || 0;
    if (val.engagement || val.post_engagement) result.engagement = val.engagement || val.post_engagement || 0;
    if (val.inline_link_clicks) result.inline_link_clicks = val.inline_link_clicks || 0;
    if (val.outbound_clicks) result.outbound_clicks = val.outbound_clicks || 0;
    if (val.conversions) result.conversions = val.conversions || 0;
    
    // Set the appropriate primary metric based on campaign objective
    // Also populate actions field for chart display
    switch (objective) {
      case 'OUTCOME_LEADS':
        result.leads = val.actions || 0;
        result.actions = val.actions || 0;
        break;
      case 'OUTCOME_TRAFFIC':
        result.clicks = val.clicks || 0;
        result.actions = val.clicks || 0;
        break;
      case 'OUTCOME_AWARENESS':
        // Use reach instead of impressions for awareness campaigns
        result.reach = val.reach || 0;
        result.actions = val.reach || val.impressions || 0;
        break;
      case 'OUTCOME_ENGAGEMENT':
        // For engagement campaigns, combine inbound and outbound clicks
        const inboundClicks = val.inline_link_clicks || 0;
        const outboundClicks = val.outbound_clicks || 0;
        const totalEngagement = inboundClicks + outboundClicks || val.engagement || val.post_engagement || 0;
        
        result.combined_clicks = totalEngagement;
        result.actions = totalEngagement > 0 ? totalEngagement : val.impressions || 0;
        break;
      case 'OUTCOME_APP_PROMOTION':
        result.app_installs = val.app_installs || val.actions || 0;
        result.actions = val.app_installs || val.actions || 0;
        break;
      case 'OUTCOME_SALES':
        // Combine conversions and purchases for sales campaigns
        const conversions = val.conversions || 0;
        const purchases = val.purchases || 0;
        const combinedSales = conversions + purchases || val.actions || 0;
        
        result.combined_sales = combinedSales;
        result.actions = combinedSales;
        break;
      default:
        // Fallback for any other or unknown campaign type
        result.impressions = val.impressions || 0;
        result.actions = val.impressions || 0;
    }
    return result
  })
}

/**
 * Enhanced parsing function for time of day data that works with all campaign types
 */
function parseTimeOfDay(tObj: Record<string, any>, objective: CampaignObjective) {
  const metricName = getMetricNameForObjective(objective);
  
  return Object.entries(tObj).map(([hour, val]) => {
    // Format the hour for display
    const displayHour = formatHour(hour);
    
    const result: any = {
      hour,
      label: hour,
      // Nice display for hover card 
      displayLabel: displayHour,
      impressions: val.impressions || 0,
      reach: val.reach || 0,
      spend: val.spend || 0,
      // Add metric name for tooltip display
      metricName: metricName
    }
    
    // Store all available metrics
    if (val.leads) result.leads = val.leads || 0;
    if (val.clicks) result.clicks = val.clicks || 0;
    if (val.actions) result.actions_original = val.actions || 0;
    if (val.video_views) result.video_views = val.video_views || 0;
    if (val.app_installs) result.app_installs = val.app_installs || 0;
    if (val.purchases) result.purchases = val.purchases || 0;
    if (val.engagement || val.post_engagement) result.engagement = val.engagement || val.post_engagement || 0;
    if (val.inline_link_clicks) result.inline_link_clicks = val.inline_link_clicks || 0;
    if (val.outbound_clicks) result.outbound_clicks = val.outbound_clicks || 0;
    if (val.conversions) result.conversions = val.conversions || 0;
    
    // Set the appropriate primary metric based on campaign objective
    // Also populate actions field for chart display
    switch (objective) {
      case 'OUTCOME_LEADS':
        result.leads = val.actions || 0;
        result.actions = val.actions || 0;
        break;
      case 'OUTCOME_TRAFFIC':
        result.clicks = val.clicks || 0;
        result.actions = val.clicks || 0;
        break;
      case 'OUTCOME_AWARENESS':
        // Use reach instead of impressions for awareness campaigns
        result.reach = val.reach || 0;
        result.actions = val.reach || val.impressions || 0;
        break;
      case 'OUTCOME_ENGAGEMENT':
        // For engagement campaigns, combine inbound and outbound clicks
        const inboundClicks = val.inline_link_clicks || 0;
        const outboundClicks = val.outbound_clicks || 0;
        const totalEngagement = inboundClicks + outboundClicks || val.engagement || val.post_engagement || 0;
        
        result.combined_clicks = totalEngagement;
        result.actions = totalEngagement > 0 ? totalEngagement : val.impressions || 0;
        break;
      case 'OUTCOME_APP_PROMOTION':
        result.app_installs = val.app_installs || val.actions || 0;
        result.actions = val.app_installs || val.actions || 0;
        break;
      case 'OUTCOME_SALES':
        // Combine conversions and purchases for sales campaigns
        const conversions = val.conversions || 0;
        const purchases = val.purchases || 0;
        const combinedSales = conversions + purchases || val.actions || 0;
        
        result.combined_sales = combinedSales;
        result.actions = combinedSales;
        break;
      default:
        // Fallback for any other or unknown campaign type
        result.impressions = val.impressions || 0;
        result.actions = val.impressions || 0;
    }
    return result
  })
}

/**
 * Custom tooltip component to show the correct metric name
 */
const CustomTooltip = ({ active, payload, label, objective }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const metricName = data.metricName || getMetricNameForObjective(objective);
    const value = payload[0].value;
    const displayLabel = data.displayLabel || data.label;
    
    return (
      <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
        <p className="text-zinc-300">{displayLabel}</p>
        <p className="text-white font-medium">{metricName}: {value}</p>
        <p className="text-zinc-400">Spend: €{(data.spend || 0).toFixed(2)}</p>
      </div>
    );
  }

  return null;
};

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
  // historical => daily + advanced
  const [historical, setHistorical] = useState<IHistoricalResponse | null>(null)
  // daily data
  const [dailyMetrics, setDailyMetrics] = useState<IDailyMetric[]>([])
  // advanced breakdown
  const [demographicsData, setDemographicsData] = useState<any[]>([])
  const [platformData, setPlatformData] = useState<any[]>([])
  const [timingData, setTimingData] = useState<any[]>([])

  // objective und primary metric
  const [objective, setObjective] = useState<CampaignObjective>('OUTCOME_TRAFFIC')
  const [primaryMetric, setPrimaryMetric] = useState<string>('clicks')

  // Tabs oben
  const [topView, setTopView] = useState<'overview' | 'extended'>('overview')
  // Chart-Tabs
  const [chartView, setChartView] = useState<'overview' | 'demographics' | 'platforms' | 'timing'>('overview')

  // Chart-Resize
  const chartRef = useRef<HTMLDivElement>(null)
  useResizeObserver({ ref: chartRef, box: 'border-box' })

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

        // daily
        let daily: IDailyMetric[] = []
        if (histData.daily_metrics && histData.daily_metrics.length > 0) {
          daily = histData.daily_metrics
        } else if (histData.basic_metrics && histData.basic_metrics.length > 0) {
          daily = histData.basic_metrics as IDailyMetric[]
        }
        setDailyMetrics(daily)

        // objective aus campaign_details
        if (histData.campaign_details?.objective) {
          setObjective(histData.campaign_details.objective)
          const metricKey = histData.campaign_details.objective === 'OUTCOME_LEADS' 
            ? 'leads'
            : histData.campaign_details.objective === 'OUTCOME_TRAFFIC'
              ? 'clicks'
              : 'impressions'
          setPrimaryMetric(metricKey)
        }

        // advanced
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

  // Wenn nicht geladen => Button
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

  // aggregator noch nicht da => Spinner
  if (!aggregator) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <IconSpinner className="size-8 animate-spin text-green-400" />
      </div>
    )
  }

  // historical nicht da => Spinner
  if (!historical) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <IconSpinner className="size-8 animate-spin text-blue-400" />
      </div>
    )
  }

  // Zusammenfassung - Use aggregator for standard metrics as it's more accurate
  const campaignName = aggregator.campaign_name
  const creationDate = aggregator.creation_date
  const status = aggregator.status

  // Use aggregator data for primary metrics (more accurate) rather than historical
  const totalLeads = aggregator.total_leads || 0
  const totalSpent = aggregator.total_spent || 0
  const totalClicks = aggregator.clicks || 0 
  const totalImpressions = aggregator.impressions || 0
  const totalReach = aggregator.reach || 0
  const averageCtr = aggregator.ctr || 0
  const averageFrequency = aggregator.frequency || 0

  // Get these from historical if they're not in aggregator
  const averageCpc = historical.summary?.average_cpc || 0
  const averageCpm = historical.summary?.average_cpm || 0
  const averageCpa = historical.summary?.average_cpa || 0

  // Budget-Fix
  const aggregatorDailyBudget = (aggregator as any).daily_budget
    ? (aggregator as any).daily_budget / 100
    : 0

  // ChartData
  const chartData = dailyMetrics.map((d) => {
    const formattedDate = format(new Date(d.date), 'MMM d, yyyy')

    if (objective === 'OUTCOME_LEADS') {
      return { date: formattedDate, leads: d.leads || 0 }
    } else if (objective === 'OUTCOME_TRAFFIC') {
      return { date: formattedDate, clicks: d.clicks || 0 }
    } else {
      return { date: formattedDate, impressions: d.impressions || 0 }
    }
  })

  // MetricConfigs
  const metricConfigs = getPrimaryMetricsForCampaign(objective)

  // Haupt-Inhalt pro Top-Tab
  let topViewContent: React.ReactNode
  if (topView === 'overview') {
    topViewContent = (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricConfigs.map((config, index) => {
          // Use aggregator for standard metrics instead of historical.summary
          let summaryValue = 0;
          
          // Get value from aggregator first (more accurate)
          if (config.key === "total_leads") {
            summaryValue = aggregator.total_leads || 0;
          } else if (config.key === "total_spend") {
            summaryValue = aggregator.total_spent || 0;
          } else if (config.key === "total_clicks") {
            summaryValue = aggregator.clicks || 0;
          } else if (config.key === "total_impressions") {
            summaryValue = aggregator.impressions || 0;
          } else if (config.key === "average_ctr") {
            summaryValue = aggregator.ctr || 0;
          } else if (config.key === "average_frequency") {
            summaryValue = aggregator.frequency || 0;
          } else {
            // Fallback to historical.summary if not in aggregator
            summaryValue = historical.summary?.[config.key as keyof typeof historical.summary] || 0;
          }
          
          // Das Format (z.B. CTR /100) wird jetzt bereits in config.format angewandt
          const displayValue = config.format ? config.format(summaryValue) : summaryValue

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
    )
  } else if (topView === 'extended') {
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
      extendedMetrics = [
        { label: 'CPM', value: `€${averageCpm.toFixed(2)}` },
        { label: 'Frequency', value: averageFrequency.toFixed(2) },
        { label: 'Post Engagement', value: dailyMetrics[0]?.post_engagement || 0 },
        // CTR display fix
        { label: 'CTR', value: `${(averageCtr).toFixed(2)}%` },
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
    // dailytable - keeping the code but not showing it in the UI
    topViewContent = (
      <div className="overflow-auto max-h-[500px] border border-zinc-800 rounded-lg hidden">
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
                  {/* Fix: CTR display as-is */}
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

  // Für die Charts: Key auf Basis des Ziels
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{campaignName}</div>
          <div className="text-sm text-zinc-400">
            Created: {format(new Date(creationDate), 'MMM d, yyyy HH:mm')}
          </div>
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

      {/* Tabs: overview, extended (dailytable hidden) */}
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
      </div>

      {topViewContent}

      {/* Nur wenn topView != dailytable => Chart-Bereich */}
      {true && (
        <>
          <div className="flex gap-2 mt-6 mb-4">
            <ViewTab
              active={chartView === 'overview'}
              onClick={() => setChartView('overview')}
              icon={<BarChart2 size={16} />}
              label={`Daily ${
                objective === 'OUTCOME_LEADS'
                  ? 'Leads'
                  : objective === 'OUTCOME_TRAFFIC'
                  ? 'Clicks'
                  : 'Impressions'
              }`}
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
                    dataKey="label" 
                    stroke="#666"
                    tick={false} // Hide the actual labels, they'll show in tooltip
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    content={<CustomTooltip objective={objective} />}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="actions" fill="#8884d8" />
                </BarChart>
              ) : chartView === 'platforms' ? (
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#666"
                    tick={false} // Hide the actual labels, they'll show in tooltip
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    content={<CustomTooltip objective={objective} />}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="actions" fill="#82ca9d" />
                </BarChart>
              ) : (
                <LineChart data={timingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#666" 
                    tick={false} // Hide the actual labels, they'll show in tooltip
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    content={<CustomTooltip objective={objective} />}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actions"
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
  icon: React.ReactNode
}
const MetricCard = ({ title, value, icon }: MetricCardProps) => {
  return (
    <div className="bg-zinc-900 p-4 rounded-lg">
      <div className="mb-2 flex items-start justify-between">
        <div className="text-sm text-zinc-400">{title}</div>
        {icon}
      </div>
      <div className="mb-1 text-xl font-bold">{value}</div>
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