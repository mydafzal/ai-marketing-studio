'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useResizeObserver } from 'usehooks-ts';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  MousePointer,
  Eye,
  DollarSign,
  RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary';
import { getCampaignHistoricalLeadsResults } from "@/lib/api/fasty-bot/get-historical-leads";
import { cn } from '@/lib/utils';
import { IconSpinner } from '@/components/ui/icons';

interface IStockProps {
  campaignId: string;
  isActive?: boolean;
}

export function Stock({ campaignId, isActive }: IStockProps) {
  const [isActivated, activate] = useState(!!isActive);
  const [campaignSummary, setSummary] = useState<CampaignSummary | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; leads: number }[]>([]);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const chartRef = useRef<HTMLDivElement>(null);

  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  });

  // Keep your original useEffects unchanged
  useEffect(() => {
    if (campaignId && isActivated) {
      const fetch = async () => {
        try {
          const result = await getCampaignSummary(campaignId);
          console.log('campaign summary in stock', result);
          setSummary(result);
        } catch (error) {
          console.error('Error fetching campaign summary:', error);
        }
      }
      void fetch();
    }
  }, [campaignId, isActivated]);

  useEffect(() => {
    if (campaignSummary && isActivated) {
      const fetch = async () => {
        try {
          const results = await getCampaignHistoricalLeadsResults(campaignSummary.campaign_id, 'last_month');
          const formattedData = results.lead_results.map(item => ({
            date: format(new Date(item.date), 'MMM d'),
            leads: item.leads
          }));
          setDailyData(formattedData);
        } catch (error) {
          console.error('Error fetching campaign data:', error);
        }
      }
      void fetch();
    }
  }, [campaignSummary, isActivated]);

  const refresh = useCallback(() => {
    activate(true);
  }, []);

  const costPerLead = campaignSummary
    ? (campaignSummary.total_spent / campaignSummary.total_leads).toFixed(2)
    : '0';

  const conversionRate = campaignSummary
    ? ((campaignSummary.total_leads / campaignSummary.clicks) * 100).toFixed(2)
    : '0';

  if (!isActivated) {
    return (
      <div className="flex h-96 items-center justify-center">
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600"
        >
          <RotateCw className="size-5" />
          Refresh Dashboard
        </button>
      </div>
    );
  }

  if (!campaignSummary) {
    return (
      <div className="flex h-96 items-center justify-center">
        <IconSpinner className="size-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
            {campaignSummary.campaign_name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Created {format(new Date(campaignSummary.creation_date), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            campaignSummary.status === 'ACTIVE' 
              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-500"
          )}>
            {campaignSummary.status}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Leads</CardTitle>
            <Users className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{campaignSummary.total_leads}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">Conversion Rate: {conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Spent</CardTitle>
            <DollarSign className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
              ${campaignSummary.total_spent.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">Cost per Lead: ${costPerLead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Click Performance</CardTitle>
            <MousePointer className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{campaignSummary.clicks}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">
              CTR: {campaignSummary.ctr.toFixed(2)}% • Unique: {campaignSummary.unique_clicks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Reach & Frequency</CardTitle>
            <Eye className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{campaignSummary.reach}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">
              Frequency: {campaignSummary.frequency.toFixed(2)} • Impressions: {campaignSummary.impressions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zinc-900 dark:text-zinc-200">Leads Over Time</CardTitle>
            <div className="space-x-2">
              <button
                onClick={() => setView('daily')}
                className={cn(
                  "rounded-lg px-3 py-1 text-sm transition-colors",
                  view === 'daily' 
                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500" 
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                Daily
              </button>
              <button
                onClick={() => setView('weekly')}
                className={cn(
                  "rounded-lg px-3 py-1 text-sm transition-colors",
                  view === 'weekly' 
                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500" 
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                Weekly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={view === 'daily' ? [dailyData[dailyData.length - 1]] : dailyData}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e5e7eb" 
                  className="dark:stroke-zinc-800" 
                />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a"
                  fontSize={12}
                  className="dark:stroke-zinc-500"
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  className="dark:stroke-zinc-500"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#leadGradient)"
                  className="dark:stroke-green-500"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}