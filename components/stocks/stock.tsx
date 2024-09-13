'use client'

import { useCallback, useContext, useState, useRef, useEffect } from 'react'
import { scaleLinear } from 'd3-scale'
import { format, subDays } from 'date-fns'
import { useResizeObserver } from 'usehooks-ts'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { CampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaignHistoricalLeadsResults } from "@/lib/api/fasty-bot/get-historical-leads";
import { cn } from '@/lib/utils'

interface IStockProps {
  isActive?: boolean;
}

export function Stock({ isActive }: IStockProps) {
  const { summary: campaignSummary } = useContext(CampaignContext)

  const [isActivated, activate] = useState(!!isActive)
  const [view, setView] = useState<'daily' | 'historical'>('daily');
  const [isFetched, updateFetchState] = useState(false)
  const [dailyData, setDailyData] = useState<{ date: string; leads: number }[]>([]);

  const chartRef = useRef<HTMLDivElement>(null);
  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isActivated || !campaignSummary) return;
        const results = await getCampaignHistoricalLeadsResults(campaignSummary.campaign_id, 'last_month');
        updateFetchState(true)
        const formattedData = results.lead_results.map(item => ({
          date: format(new Date(item.date), 'MMM d'),
          leads: item.leads
        }));
        setDailyData(formattedData);
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      }
    };
    fetchData();
  }, [campaignSummary, isActivated]);

  const refresh = useCallback(() => {
    activate(true)
  }, []);

  if (!campaignSummary) {
    return <div>Loading...</div>;
  }

  return (
    <StockTemplate campaignSummary={isActivated && isFetched ? campaignSummary : null} refresh={refresh}>
      <div className="mt-4 flex justify-between">
        <button
            className={`px-4 py-2 rounded-lg ${view === 'daily' ? 'bg-zinc-700' : 'bg-zinc-600'}`}
            onClick={() => setView('daily')}
        >
          Daily View
        </button>
        <button
            className={`px-4 py-2 rounded-lg ${view === 'historical' ? 'bg-zinc-700' : 'bg-zinc-600'}`}
            onClick={() => setView('historical')}
        >
          Historical View
        </button>
      </div>

      <div className="relative mt-4" ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={view === 'daily' ? [dailyData[dailyData.length - 1]] : dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="leads" fill="#34a853" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </StockTemplate>
  );
}

interface IStockTemplateProps {
  campaignSummary: CampaignSummary | null;
  children: React.ReactNode;
  refresh: () => void;
}

function StockTemplate({ campaignSummary, children, refresh }: IStockTemplateProps) {
  return (
    <div className="relative">
      <div className={cn(
        'rounded-xl border bg-zinc-950 p-4 text-green-400',
        !campaignSummary ? 'pointer-events-none	blur' : '',
      )}>
        <div className="float-right inline-block rounded-full bg-white/10 px-2 py-1 text-xs">
          {campaignSummary?.status ?? 'Campaign Status'}
        </div>
        <div className="text-lg text-zinc-300">{campaignSummary?.campaign_name ?? 'Campaign Name'}</div>
        <div className="text-3xl font-bold">{campaignSummary?.total_leads ?? 'Campaign Total'} Leads</div>
        <div className="text mt-1 text-xs text-zinc-500">
          Created: {campaignSummary?.creation_date ? format(new Date(campaignSummary.creation_date), 'MMM d, yyyy HH:mm') : ''}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-zinc-500">Clicks:</span> {campaignSummary?.clicks ?? '0'}
          </div>
          <div>
            <span className="text-zinc-500">Impressions:</span> {campaignSummary?.impressions ?? '0'}
          </div>
          <div>
            <span className="text-zinc-500">CTR:</span> {campaignSummary?.ctr.toFixed(2) ?? 0}%
          </div>
          <div>
            <span className="text-zinc-500">Reach:</span> {campaignSummary?.reach ?? 0}
          </div>
          <div>
            <span className="text-zinc-500">Frequency:</span> {campaignSummary?.frequency.toFixed(2) ?? 0}
          </div>
          <div>
            <span className="text-zinc-500">Unique Clicks:</span> {campaignSummary?.unique_clicks ?? 0}
          </div>
          <div>
            <span className="text-zinc-500">Total Spent:</span> ${campaignSummary?.total_spent.toFixed(2) ?? 0}
          </div>
        </div>
        { children }
      </div>
      <div className={cn(
        'absolute text-center top-[50%] w-full',
        !campaignSummary ? '' : 'hidden',
      )}>
        <div className="mb-3">
          This analytics is old. If you want to refresh, click the button below.
        </div>
        <button
          className="px-4 py-2 rounded-lg bg-green-600"
          onClick={refresh}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}