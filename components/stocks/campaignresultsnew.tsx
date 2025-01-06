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
  PieChart
} from 'lucide-react'
import { Clock as LucideClock } from 'lucide-react'
import { useActions, useAIState, useUIState } from 'ai/rsc'

// ----------------------------------------------------------------
// 1) Imports for Data
// ----------------------------------------------------------------
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaignHistoricalMetrics } from '@/lib/api/fasty-bot/helpers/get-campaign-historical-metrics'

// ----------------------------------------------------------------
// 2) Type Definitions
// ----------------------------------------------------------------
interface IStockProps {
  campaignId: string
  isActive?: boolean
}

/** Single day’s metrics from the historical endpoint */
interface IDailyMetric {
  date: string
  leads: number
  spend: number
  cpc: number
  cpm: number
  ctr: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  unique_clicks: number
  cpa: number
  website_ctr: number
  [key: string]: number | string
}

/** Possibly advanced data from the historical endpoint. */
interface IAdvancedMetrics {
  demographics?: Record<string, any>
  platforms?: Record<string, any>
  time_of_day?: Record<string, any>
}

/** Root shape of your historical endpoint’s response. */
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

// ----------------------------------------------------------------
// 3) Utility / Rolling Change
// ----------------------------------------------------------------
/**
 * Compares the average of the last 7 days vs. the previous 7 days,
 * returning a percentage difference (like +12.5 or -3.4).
 */
function calcPercentageChange(values: number[]): number {
  if (values.length < 14) return 0
  const last7 = values.slice(values.length - 7)
  const prev7 = values.slice(values.length - 14, values.length - 7)
  const avgLast = last7.reduce((acc, n) => acc + n, 0) / 7
  const avgPrev = prev7.reduce((acc, n) => acc + n, 0) / 7
  if (avgPrev === 0) {
    return avgLast > 0 ? 100 : 0
  }
  return ((avgLast - avgPrev) / avgPrev) * 100
}

// For advanced breakdown
function parseDemographics(demoObj: Record<string, any>) {
  return Object.entries(demoObj).map(([key, val]) => {
    const [ageRange, gender] = key.split('_')
    return {
      ageRange,
      gender,
      impressions: val.impressions,
      spend: val.spend,
      leads: val.actions // or "actions" if that stands for leads
    }
  })
}
function parsePlatforms(platformObj: Record<string, any>) {
  return Object.entries(platformObj).map(([platform, val]) => ({
    platform,
    impressions: val.impressions,
    spend: val.spend,
    leads: val.actions
  }))
}
function parseTimeOfDay(tObj: Record<string, any>) {
  return Object.entries(tObj).map(([hour, val]) => ({
    hour,
    impressions: val.impressions,
    spend: val.spend,
    leads: val.actions
  }))
}

// ----------------------------------------------------------------
// 4) The Stock Component
// ----------------------------------------------------------------
export function Stock({ campaignId, isActive }: IStockProps) {
  // 4A) AI Tools
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [_, setMessages] = useUIState<any>()

  // Activation
  const [activated, setActivated] = useState(!!isActive)
  const handleActivate = useCallback(() => {
    setActivated(true)
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

  /**
   * topView now has 3 states:
   * - 'overview' => Key Stats
   * - 'extended' => Extended Stats
   * - 'dailytable' => Daily Table
   */
  const [topView, setTopView] = useState<'overview' | 'extended' | 'dailytable'>('overview')

  // Chart sub-tabs
  const [chartView, setChartView] = useState<'overview' | 'demographics' | 'platforms' | 'timing'>('overview')

  const chartRef = useRef<HTMLDivElement>(null)
  useResizeObserver({ ref: chartRef, box: 'border-box' })

  // 4B) Load aggregator (the single campaign summary with correct data)
  useEffect(() => {
    if (!activated || !campaignId) return
    const loadAggregator = async () => {
      try {
        const data = await getCampaignSummary(campaignId)
        setAggregator(data)
        console.log('Aggregator =>', data)

        if (data && data.campaign_id !== '0') {
          const msg = `System: aggregator loaded for campaign '${data.campaign_name}'. It has ${data.total_leads} leads, €${data.total_spent.toFixed(2)} spent.`
          const resp = await submitUserMessage(msg, [], true)
          setMessages((old: any[]) => [...old, resp])
        }
      } catch (err) {
        console.error('Error aggregator =>', err)
      }
    }
    void loadAggregator()
  }, [activated, campaignId, submitUserMessage, setMessages])

  // 4C) Load advanced historical data
  useEffect(() => {
    if (!activated || !campaignId) return
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

        // advanced
        const adv = histData.advanced_metrics
        if (adv?.demographics) setDemographicsData(parseDemographics(adv.demographics))
        if (adv?.platforms) setPlatformData(parsePlatforms(adv.platforms))
        if (adv?.time_of_day) setTimingData(parseTimeOfDay(adv.time_of_day))
      } catch (err) {
        console.error('Error historical =>', err)
      }
    }
    void loadHistorical()
  }, [activated, campaignId])

  // If not activated => big "Show Results" button
  if (!activated) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <button
          onClick={handleActivate}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
        >
          Show Results
        </button>
      </div>
    )
  }

  // aggregator not loaded => spinner
  if (!aggregator) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <IconSpinner className="size-8 animate-spin text-green-400" />
      </div>
    )
  }

  // historical not loaded => spinner
  if (!historical) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <IconSpinner className="size-8 animate-spin text-blue-400" />
      </div>
    )
  }

  // aggregator data
  const totalLeads = aggregator.total_leads
  const totalSpent = aggregator.total_spent
  const campaignName = aggregator.campaign_name
  const creationDate = aggregator.creation_date
  const status = aggregator.status
  const clicks = aggregator.clicks
  const ctr = aggregator.ctr // e.g. 2.10
  const frequency = aggregator.frequency
  const impressions = aggregator.impressions
  const reach = aggregator.reach
  const uniqueClicks = aggregator.unique_clicks

  // aggregator might say daily_budget=1000 => user wants 10 EUR
  const aggregatorDailyBudget = aggregator.daily_budget
    ? aggregator.daily_budget / 100
    : 0

  // leads/spend rolling changes from daily
  const leadsArray = dailyMetrics.map((d) => d.leads ?? 0)
  const spendArray = dailyMetrics.map((d) => d.spend ?? 0)
  const leadsChange = calcPercentageChange(leadsArray)
  const spendChange = calcPercentageChange(spendArray)

  // Chart data => daily leads
  const chartData = dailyMetrics.map((d) => ({
    date: format(new Date(d.date), 'MMM d, yyyy'),
    leads: d.leads
  }))

  // For top-level slides: we have 3 => overview, extended, dailytable
  let topViewContent: React.ReactNode
  if (topView === 'overview') {
    // Key Stats
    topViewContent = (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          change={leadsChange.toFixed(1)}
          icon={<TrendingUp className="text-blue-400" />}
          subLabel="(past 14 days)"
        />
        <MetricCard
          title="Total Spent"
          value={`€${totalSpent.toFixed(2)}`}
          change={spendChange.toFixed(1)}
          icon={<DollarSign className="text-green-400" />}
          subLabel="(past 14 days)"
        />
        <MetricCard
          title="CTR"
          value={`${(ctr || 0).toFixed(2)}%`}
          change="+1.2"
          icon={<Target className="text-purple-400" />}
          subLabel="(overall)"
        />
        <MetricCard
          title="Frequency"
          value={frequency.toFixed(2)}
          change="+0.4"
          icon={<BarChart2 className="text-yellow-400" />}
          subLabel="(overall)"
        />
      </div>
    )
  } else if (topView === 'extended') {
    // Extended Stats
    topViewContent = (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Impressions</div>
          <div className="text-xl font-bold">{impressions}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Reach</div>
          <div className="text-xl font-bold">{reach}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Clicks</div>
          <div className="text-xl font-bold">{clicks}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Unique Clicks</div>
          <div className="text-xl font-bold">{uniqueClicks}</div>
        </div>
        {/* row 2 */}
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Cost/Lead</div>
          <div className="text-xl font-bold">
            €{(totalSpent / (totalLeads || 1)).toFixed(2)}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Cost/Click</div>
          <div className="text-xl font-bold">
            {clicks > 0 ? `€${(totalSpent / clicks).toFixed(2)}` : '-'}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Daily Budget</div>
          <div className="text-xl font-bold">
            {aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : '-'}
          </div>
        </div>
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
                  <TdCell>{item.leads}</TdCell>
                  <TdCell>€{(item.spend ?? 0).toFixed(2)}</TdCell>
                  <TdCell>€{(item.cpc ?? 0).toFixed(2)}</TdCell>
                  <TdCell>€{(item.cpm ?? 0).toFixed(2)}</TdCell>
                  <TdCell>{(item.ctr ?? 0).toFixed(2)}%</TdCell>
                  <TdCell>{item.impressions ?? 0}</TdCell>
                  <TdCell>{item.reach ?? 0}</TdCell>
                  <TdCell>{(item.frequency ?? 0).toFixed(2)}</TdCell>
                  <TdCell>{item.clicks ?? 0}</TdCell>
                  <TdCell>{item.unique_clicks ?? 0}</TdCell>
                  <TdCell>€{(item.cpa ?? 0).toFixed(2)}</TdCell>
                  <TdCell>{(item.website_ctr ?? 0).toFixed(2)}</TdCell>
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

  // Chart data => daily leads chart
  return (
    <div className="relative min-h-[600px] bg-zinc-950 p-6 text-white space-y-6">
      {/* Header: Campaign Name, date, status, AI button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{campaignName}</div>
          <div className="text-sm text-zinc-400">
            Created: {format(new Date(creationDate), 'MMM d, yyyy HH:mm')}
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

      {/* Possibly show daily budget with factor adjust */}
      <div className="text-sm text-zinc-400">
        (Daily Budget: {aggregatorDailyBudget > 0 ? `€${aggregatorDailyBudget}` : 'N/A'})
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
              label="Daily Leads"
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
                    dataKey="leads"
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
                  <Bar dataKey="leads" fill="#8884d8" />
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
                  <Bar dataKey="leads" fill="#82ca9d" />
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
                    dataKey="leads"
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
// 5) Helper Sub-Components
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
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-zinc-400">{title}</div>
        {icon}
      </div>
      <div className="text-xl font-bold mb-1">{value}</div>
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
