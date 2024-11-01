'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { useResizeObserver } from 'usehooks-ts'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaignHistoricalLeadsResults } from "@/lib/api/fasty-bot/get-historical-leads"
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'
import { Brain, TrendingUp, DollarSign, Target, BarChart2, PieChart } from 'lucide-react'
import { Clock as LucideClock } from 'lucide-react'
interface IStockProps {
  campaignId: string;
  isActive?: boolean;
}

export function Stock({ campaignId, isActive }: IStockProps) {
  const [isActivated, activate] = useState(!!isActive)
  const [campaignSummary, setSummary] = useState<CampaignSummary | null>(null)
  
  useEffect(() => {
    if (campaignId && isActivated) {
      const fetch = async () => {
        try {
          const result = await getCampaignSummary(campaignId)
          console.log('campaign summary in stock', result)
          setSummary(result)
        } catch (error) {
          console.error('Error fetching campaign summary:', error)
        }
      }
      void fetch()
    }
  }, [campaignId, isActivated])

  const [dailyData, setDailyData] = useState<{ date: string; leads: number }[]>([])
  useEffect(() => {
    if (campaignSummary && isActivated) {
      const fetch = async () => {
        try {
          const results = await getCampaignHistoricalLeadsResults(campaignSummary.campaign_id, 'last_month')
          const formattedData = results.lead_results.map(item => ({
            date: format(new Date(item.date), 'MMM d'),
            leads: item.leads
          }))
          setDailyData(formattedData)
        } catch (error) {
          console.error('Error fetching campaign data:', error)
        }
      }
      void fetch()
    }
  }, [campaignSummary, isActivated])

  const refresh = useCallback(() => {
    activate(true)
  }, [])

  const [view, setView] = useState<'overview' | 'demographics' | 'placement' | 'timing'>('overview')
  const chartRef = useRef<HTMLDivElement>(null)
  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  })

  // Dummy data for new metrics
  const dummyDemographics = [
    { age: '18-24', value: 30 },
    { age: '25-34', value: 45 },
    { age: '35-44', value: 15 },
    { age: '45-54', value: 10 }
  ]

  const dummyPlacements = [
    { platform: 'Facebook Feed', value: 60 },
    { platform: 'Instagram Feed', value: 25 },
    { platform: 'Stories', value: 15 }
  ]

  const dummyHourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    engagement: Math.random() * 100
  }))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-2xl font-bold">{campaignSummary?.campaign_name ?? 'Campaign Name'}</div>
          <div className="text-sm text-zinc-400">
            Created: {campaignSummary?.creation_date ? format(new Date(campaignSummary.creation_date), 'MMM d, yyyy HH:mm') : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'px-3 py-1 rounded-full text-sm',
            campaignSummary?.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          )}>
            {campaignSummary?.status ?? 'Campaign Status'}
          </div>
          <button 
            className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            onClick={() => console.log('AI Analysis requested')}
          >
            <Brain size={16} />
            AI Analysis
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Leads"
          value={campaignSummary?.total_leads ?? 0}
          change="+12.5%"
          icon={<TrendingUp className="text-blue-400" />}
        />
        <MetricCard
          title="Total Spent"
          value={`$${campaignSummary?.total_spent.toFixed(2) ?? '0.00'}`}
          change="-2.3%"
          icon={<DollarSign className="text-green-400" />}
        />
        <MetricCard
          title="CTR"
          value={`${campaignSummary?.ctr.toFixed(2) ?? '0'}%`}
          change="+5.2%"
          icon={<Target className="text-purple-400" />}
        />
        <MetricCard
          title="Cost per Lead"
          value={`$${((campaignSummary?.total_spent ?? 0) / (campaignSummary?.total_leads || 1)).toFixed(2)}`}
          change="-8.1%"
          icon={<DollarSign className="text-red-400" />}
        />
      </div>

      {/* View Selection Tabs */}
      <div className="flex gap-2 mb-6">
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
          active={view === 'placement'}
          onClick={() => setView('placement')}
          icon={<BarChart2 size={16} />}
          label="Placement"
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
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="leads" stroke="#34a853" strokeWidth={2} dot={false} />
            </LineChart>
          ) : view === 'demographics' ? (
            <BarChart data={dummyDemographics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="age" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          ) : view === 'placement' ? (
            <BarChart data={dummyPlacements}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="platform" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          ) : (
            <LineChart data={dummyHourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="engagement" stroke="#ffa726" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Impressions</div>
          <div className="text-xl font-bold">{campaignSummary?.impressions ?? 0}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Reach</div>
          <div className="text-xl font-bold">{campaignSummary?.reach ?? 0}</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-sm text-zinc-400">Frequency</div>
          <div className="text-xl font-bold">{campaignSummary?.frequency.toFixed(2) ?? 0}</div>
        </div>
      </div>

      {/* Loading State */}
      {!isActivated && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={refresh}
          >
            Refresh Data
          </button>
        </div>
      )}
      {isActivated && !campaignSummary && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
          <IconSpinner className="animate-spin text-blue-400" />
        </div>
      )}
    </div>
  )
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, change, icon }: MetricCardProps) => (
  <div className="bg-zinc-900 p-4 rounded-lg">
    <div className="flex justify-between items-start mb-2">
      <div className="text-sm text-zinc-400">{title}</div>
      {icon}
    </div>
    <div className="text-xl font-bold mb-1">{value}</div>
    <div className={cn(
      'text-sm',
      change.startsWith('+') ? 'text-green-400' : 'text-red-400'
    )}>
      {change} vs. last period
    </div>
  </div>
)

interface ViewTabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
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

// Export the skeleton component as well
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
      <div className="relative -mx-4 cursor-col-resize mt-4">
        <div style={{ height: 146 }}></div>
      </div>
    </div>
  )
}