'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
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

import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaignHistoricalMetrics } from '@/lib/api/fasty-bot/helpers/get-campaign-historical-metrics'

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

// ------------------------------------------------------
// 1) Type Definitions
// ------------------------------------------------------
interface IStockProps {
  campaignId: string
  isActive?: boolean
}

/** Basic or advanced daily metric item */
interface IMetricItem {
  date?: string
  date_start?: string
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
  cost_per_video_view?: number
  cost_per_link_click?: number
  cost_per_lead?: number
  cost_per_page_engagement?: number
  cost_per_onsite_conversion_post_save?: number
  cost_per_post_engagement?: number
  cost_per_landing_page_view?: number
  cost_per_onsite_conversion_lead_grouped?: number
}

/** Summary shape */
interface ISummary {
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

/** Advanced metrics shape based on your example. */
interface IAdvancedMetrics {
  demographics?: Record<
    string,
    {
      impressions: number
      spend: number
      actions: number
    }
  >
  geography?: Record<string, { impressions: number; spend: number; actions: number }>
  platforms?: Record<string, { impressions: number; spend: number; actions: number }>
  time_of_day?: Record<string, { impressions: number; spend: number; actions: number }>
  placements?: Record<string, any>
  engagement?: any
  video_metrics?: any
  audience_metrics?: any
}

interface IHistoricalMetrics {
  campaign_id: string
  timeline: string
  basic_metrics?: IMetricItem[]
  advanced_metrics?: IAdvancedMetrics
  daily_metrics?: IMetricItem[]
  summary?: ISummary
  campaign_details?: {
    name: string
    status: string
    start_time?: string
    daily_budget?: number
    lifetime_budget?: number
    objective?: string
  }
}

// ------------------------------------------------------
// 2) Helper Parsers for Demographics, Platforms, Timing
// ------------------------------------------------------

/** 
 * Demographics example:
 *  "18-24_male": { impressions: 1398, spend: 19.398, actions: 2 }
 * => { ageRange: "18-24", gender: "male", leads: 2, impressions: 1398, spend:19.398 }
 */
function parseDemographics(
  demoObj: Record<string, { impressions: number; spend: number; actions: number }>
) {
  return Object.entries(demoObj).map(([key, val]) => {
    const [ageRange, gender] = key.split('_') // e.g. "18-24_male"
    return {
      ageRange,
      gender,
      leads: val.actions,
      impressions: val.impressions,
      spend: val.spend,
    }
  })
}

/**
 * "platforms" example from your JSON:
 *   "instagram_instagram_stories_mobile_app": { impressions: 14102, spend: 243.780497, actions: 23 }
 * => { platform: "instagram_instagram_stories_mobile_app", leads: 23, impressions:14102, spend:243.780497 }
 */
function parsePlatforms(
  platformObj: Record<string, { impressions: number; spend: number; actions: number }>
) {
  return Object.entries(platformObj).map(([platform, val]) => ({
    platform,
    leads: val.actions,
    impressions: val.impressions,
    spend: val.spend,
  }))
}

/**
 * time_of_day example:
 * "00:00:00 - 00:59:59": { impressions:2640, spend:48.116151, actions:7 }
 * => { hour: "00:00:00 - 00:59:59", leads:7, impressions:2640, spend:48.116151 }
 */
function parseTimeOfDay(
  timeObj: Record<string, { impressions: number; spend: number; actions: number }>
) {
  return Object.entries(timeObj).map(([hour, val]) => ({
    hour,
    leads: val.actions,
    impressions: val.impressions,
    spend: val.spend
  }))
}

// ------------------------------------------------------
// 3) Main Component
// ------------------------------------------------------
export function Stock({ campaignId, isActive }: IStockProps) {
  /* Activation / Refresh State */
  const [isActivated, activate] = useState(!!isActive)
  const refresh = useCallback(() => {
    activate(true)
  }, [])

  /* 3A) Campaign Overview Data */
  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary | null>(null)
  useEffect(() => {
    if (campaignId && isActivated) {
      const fetchSummary = async () => {
        try {
          const result = await getCampaignSummary(campaignId)
          console.log('campaign summary in stock', result)
          setCampaignSummary(result)
        } catch (error) {
          console.error('Error fetching campaign summary:', error)
        }
      }
      void fetchSummary()
    }
  }, [campaignId, isActivated])

  /* 3B) Historical Metrics (with advanced_mode=true, last_year) */
  const [historicalMetrics, setHistoricalMetrics] = useState<IHistoricalMetrics | null>(null)

  // For the daily chart
  const [dailyData, setDailyData] = useState<{ date: string; leads: number }[]>([])
  // For advanced breakdowns
  const [demographicsData, setDemographicsData] = useState<
    { ageRange: string; gender: string; leads: number; impressions: number; spend: number }[]
  >([])
  const [platformData, setPlatformData] = useState<
    { platform: string; leads: number; impressions: number; spend: number }[]
  >([])
  const [timingData, setTimingData] = useState<
    { hour: string; leads: number; impressions: number; spend: number }[]
  >([])

  useEffect(() => {
    if (campaignId && isActivated) {
      const fetchHistoricalData = async () => {
        try {
          // advanced_mode = true, timeline = "last_year"
          const data = await getCampaignHistoricalMetrics(campaignId, 'last_year', true)
          console.log('Fetched historical metrics (advanced):', data)
          setHistoricalMetrics(data)

          // 1. Unify daily metrics
          let finalDaily: IMetricItem[] = []
          if (data?.daily_metrics?.length) {
            finalDaily = data.daily_metrics
          } else if (data?.basic_metrics?.length) {
            finalDaily = data.basic_metrics
          }

          // Format for the Overview chart
          const formattedOverview = finalDaily.map((item) => {
            const rawDate = item.date ?? item.date_start ?? ''
            return {
              date: format(new Date(rawDate), 'MMM d'),
              leads: item.leads ?? 0
            }
          })
          setDailyData(formattedOverview)

          // 2. Advanced metrics breakdown
          const adv = data.advanced_metrics || {}

          // Demographics
          if (adv.demographics) {
            const parsedDemo = parseDemographics(adv.demographics)
            setDemographicsData(parsedDemo)
          }
          // Platforms (replacing "placement" with "platform" in your code)
          if (adv.platforms) {
            const parsedPlatform = parsePlatforms(adv.platforms)
            setPlatformData(parsedPlatform)
          }
          // Time of day
          if (adv.time_of_day) {
            const parsedTiming = parseTimeOfDay(adv.time_of_day)
            setTimingData(parsedTiming)
          }
        } catch (error) {
          console.error('Error fetching advanced historical metrics:', error)
        }
      }
      void fetchHistoricalData()
    }
  }, [campaignId, isActivated])

  /* 3C) Summaries for UI */
  const summary = historicalMetrics?.summary || ({} as ISummary)
  const totalLeads = summary.total_leads ?? 0
  const totalSpent = summary.total_spend ?? 0
  const averageCTR = summary.average_ctr ?? 0
  const averageCPA = summary.average_cpa ?? 0
  const totalImpressions = summary.total_impressions ?? 0
  const totalReach = summary.total_reach ?? 0
  const avgFrequency = summary.average_frequency ?? 0
  const totalClicks = summary.total_clicks ?? 0
  const averageCPC = summary.average_cpc ?? 0
  const averageCPM = summary.average_cpm ?? 0
  const daysCount = summary.days_count ?? 0

  /* 3D) View Tabs */
  const [view, setView] = useState<'overview' | 'demographics' | 'platforms' | 'timing'>('overview')
  const chartRef = useRef<HTMLDivElement>(null)
  useResizeObserver({ ref: chartRef, box: 'border-box' })

  // ------------------------------------------------------
  // 4) Render
  // ------------------------------------------------------
  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-white">
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">
            {campaignSummary?.campaign_name ?? 'Campaign Name'}
          </div>
          <div className="text-sm text-zinc-400">
            Created:{' '}
            {campaignSummary?.creation_date
              ? format(new Date(campaignSummary.creation_date), 'MMM d, yyyy HH:mm')
              : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-3 py-1 rounded-full text-sm',
              campaignSummary?.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            )}
          >
            {campaignSummary?.status ?? 'Campaign Status'}
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

      {/* Key Metrics Grid (Top Row) */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          change="+12.5%"
          icon={<TrendingUp className="text-blue-400" />}
        />
        <MetricCard
          title="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          change="-2.3%"
          icon={<DollarSign className="text-green-400" />}
        />
        <MetricCard
          title="CTR"
          value={`${averageCTR.toFixed(2)}%`}
          change="+5.2%"
          icon={<Target className="text-purple-400" />}
        />
        <MetricCard
          title="Cost per Lead"
          value={`$${averageCPA.toFixed(2)}`}
          change="-8.1%"
          icon={<DollarSign className="text-red-400" />}
        />
      </div>

      {/* Additional Metrics Rows */}
      {/* Row 1 */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Impressions</div>
          <div className="text-xl font-bold">{totalImpressions}</div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Reach</div>
          <div className="text-xl font-bold">{totalReach}</div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Frequency</div>
          <div className="text-xl font-bold">{avgFrequency.toFixed(2)}</div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Clicks</div>
          <div className="text-xl font-bold">{totalClicks}</div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Avg CPC</div>
          <div className="text-xl font-bold">${averageCPC.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Avg CPM</div>
          <div className="text-xl font-bold">${averageCPM.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900 p-4">
          <div className="text-sm text-zinc-400">Days Count</div>
          <div className="text-xl font-bold">{daysCount}</div>
        </div>
      </div>

      {/* View Selection Tabs */}
      <div className="mt-6 mb-4 flex gap-2">
        <ViewTab
          active={view === 'overview'}
          onClick={() => setView('overview')}
          icon={<BarChart2 size={16} />}
          label="Overview"
        />
        <ViewTab
          active={view === 'demographics'}
          onClick={() => setView('demographics')}
          icon={<PieChart size={16} />}
          label="Demographics"
        />
        <ViewTab
          active={view === 'platforms'}
          onClick={() => setView('platforms')}
          icon={<BarChart2 size={16} />}
          label="Platforms"
        />
        <ViewTab
          active={view === 'timing'}
          onClick={() => setView('timing')}
          icon={<LucideClock size={16} />}
          label="Timing"
        />
      </div>

      {/* Chart Area */}
      <div className="relative" ref={chartRef}>
        <ResponsiveContainer width="100%" height={400}>
          {view === 'overview' ? (
            /* Over Time (Daily Data) */
            <LineChart data={dailyData}>
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
          ) : view === 'demographics' ? (
            /* Show the demographics data */
            <BarChart data={demographicsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              {/* Combine age+gender for the X-axis label */}
              <XAxis dataKey={(item) => `${item.ageRange}_${item.gender}`} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="leads" fill="#8884d8" />
            </BarChart>
          ) : view === 'platforms' ? (
            /* Show the platform data */
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
            /* Show the time_of_day data (parsed) */
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

      {/* Daily Metrics Table */}
      {historicalMetrics &&
        (historicalMetrics.daily_metrics?.length || historicalMetrics.basic_metrics?.length) && (
          <div className="mt-8">
            <h2 className="mb-2 text-lg font-semibold">Daily Metrics</h2>
            <div className="overflow-auto">
              <table className="min-w-max border-collapse border border-zinc-800 text-sm">
                <thead className="bg-zinc-900">
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
                  {(historicalMetrics.daily_metrics || historicalMetrics.basic_metrics || []).map(
                    (item, idx) => {
                      // unify date
                      const rawDate = item.date ?? item.date_start ?? 'unknown-date'
                      return (
                        <tr
                          key={idx}
                          className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50"
                        >
                          <TdCell>{rawDate}</TdCell>
                          <TdCell>{item.leads ?? 0}</TdCell>
                          <TdCell>${(item.spend ?? 0).toFixed(2)}</TdCell>
                          <TdCell>${(item.cpc ?? 0).toFixed(2)}</TdCell>
                          <TdCell>${(item.cpm ?? 0).toFixed(2)}</TdCell>
                          <TdCell>{(item.ctr ?? 0).toFixed(2)}</TdCell>
                          <TdCell>{item.impressions ?? 0}</TdCell>
                          <TdCell>{item.reach ?? 0}</TdCell>
                          <TdCell>{(item.frequency ?? 0).toFixed(2)}</TdCell>
                          <TdCell>{item.clicks ?? 0}</TdCell>
                          <TdCell>{item.unique_clicks ?? 0}</TdCell>
                          <TdCell>${(item.cpa ?? 0).toFixed(2)}</TdCell>
                          <TdCell>{(item.website_ctr ?? 0).toFixed(2)}</TdCell>
                          <TdCell>${(item.cost_per_video_view ?? 0).toFixed(2)}</TdCell>
                          <TdCell>${(item.cost_per_link_click ?? 0).toFixed(2)}</TdCell>
                          <TdCell>${(item.cost_per_lead ?? 0).toFixed(2)}</TdCell>
                          <TdCell>${(item.cost_per_page_engagement ?? 0).toFixed(2)}</TdCell>
                          <TdCell>
                            {item.cost_per_onsite_conversion_post_save
                              ? `$${(item.cost_per_onsite_conversion_post_save).toFixed(2)}`
                              : '-'}
                          </TdCell>
                          <TdCell>${(item.cost_per_post_engagement ?? 0).toFixed(2)}</TdCell>
                          <TdCell>
                            {item.cost_per_landing_page_view
                              ? `$${(item.cost_per_landing_page_view).toFixed(2)}`
                              : '-'}
                          </TdCell>
                          <TdCell>
                            {item.cost_per_onsite_conversion_lead_grouped
                              ? `$${(item.cost_per_onsite_conversion_lead_grouped).toFixed(2)}`
                              : '-'}
                          </TdCell>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Loading State Overlays */}
      {!isActivated && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            onClick={refresh}
          >
            Refresh Data
          </button>
        </div>
      )}
      {isActivated && !campaignSummary && !historicalMetrics && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
          <IconSpinner className="animate-spin text-blue-400" />
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------
// 5) Sub-Components
// ------------------------------------------------------

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
}
const MetricCard = ({ title, value, change, icon }: MetricCardProps) => (
  <div className="rounded-lg bg-zinc-900 p-4">
    <div className="mb-2 flex items-start justify-between">
      <div className="text-sm text-zinc-400">{title}</div>
      {icon}
    </div>
    <div className="mb-1 text-xl font-bold">{value}</div>
    <div className={cn('text-sm', change.startsWith('+') ? 'text-green-400' : 'text-red-400')}>
      {change} vs. last period
    </div>
  </div>
)

interface ViewTabProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}
const ViewTab = ({ active, onClick, icon, label }: ViewTabProps) => (
  <button
    className={cn(
      'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
      active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'
    )}
    onClick={onClick}
  >
    {icon}
    {label}
  </button>
)

/** Loading Skeleton (unchanged) */
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
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">xxxxx: xxx</div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">xxxxxxxxxxx: xxx</div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">xxx: xxx</div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">xxxxx: xxx</div>
      </div>
      <div className="relative -mx-4 mt-4 cursor-col-resize">
        <div style={{ height: 146 }}></div>
      </div>
    </div>
  )
}
