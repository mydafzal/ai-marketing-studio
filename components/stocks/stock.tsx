'use client'

import { useState, useRef, useEffect } from 'react'
import { scaleLinear } from 'd3-scale'
import { format, subDays } from 'date-fns'
import { useResizeObserver } from 'usehooks-ts'
import { useAIState } from 'ai/rsc'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCampaignHistoricalLeadsResults } from "@/lib/api/fasty-bot/get-historical-leads";
import {CampaignSummary, getCampaignSummary} from "@/lib/api/fasty-bot/get-campaign-summary";
import { Message } from '@/lib/types'

export function Stock() {
  const [aiState, setAIState] = useAIState();
  const [view, setView] = useState<'daily' | 'historical'>('daily');
  const [dailyData, setDailyData] = useState<Array<{ date: string; leads: number }>>([]);
  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await getCampaignSummary();
        setCampaignSummary(summary);

        const results = await getCampaignHistoricalLeadsResults(summary.campaign_id, 'last_month');
        const formattedData = results.lead_results.map(item => ({
          date: format(new Date(item.date), 'MMM d'),
          leads: item.leads
        }));
        setDailyData(formattedData);
        setAIState({
          ...aiState,
          messages: [
            ...aiState.messages.filter((message: Message) => message.id !== 'campaign-info-data' || message.role !== 'system'),
            { id: 'campaign-info-data', role: 'system', content: `Knowledge Base about current campaign infomations: ${JSON.stringify(summary)}` }
          ]
        });
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      }
    };
    fetchData();
  }, []);

  if (!campaignSummary) {
    return <div>Loading...</div>;
  }

  return (
      <div className="rounded-xl border bg-zinc-950 p-4 text-green-400">
        <div className="float-right inline-block rounded-full bg-white/10 px-2 py-1 text-xs">
          {campaignSummary.status}
        </div>
        <div className="text-lg text-zinc-300">{campaignSummary.campaign_name}</div>
        <div className="text-3xl font-bold">{campaignSummary.total_leads} Leads</div>
        <div className="text mt-1 text-xs text-zinc-500">
          Created: {format(new Date(campaignSummary.creation_date), 'MMM d, yyyy HH:mm')}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-zinc-500">Clicks:</span> {campaignSummary.clicks}
          </div>
          <div>
            <span className="text-zinc-500">Impressions:</span> {campaignSummary.impressions}
          </div>
          <div>
            <span className="text-zinc-500">CTR:</span> {campaignSummary.ctr.toFixed(2)}%
          </div>
          <div>
            <span className="text-zinc-500">Reach:</span> {campaignSummary.reach}
          </div>
          <div>
            <span className="text-zinc-500">Frequency:</span> {campaignSummary.frequency.toFixed(2)}
          </div>
          <div>
            <span className="text-zinc-500">Unique Clicks:</span> {campaignSummary.unique_clicks}
          </div>
          <div>
            <span className="text-zinc-500">Total Spent:</span> ${campaignSummary.total_spent.toFixed(2)}
          </div>
        </div>

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
      </div>
  );
}