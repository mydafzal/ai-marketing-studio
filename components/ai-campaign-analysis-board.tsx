'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useResizeObserver } from 'usehooks-ts';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Brain,
  MousePointer,
  DollarSign,
  RotateCw,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary';
import { getCampaignHistoricalLeadsResults } from '@/lib/api/fasty-bot/get-historical-leads';
import { cn } from '@/lib/utils';
import { IconSpinner } from '@/components/ui/icons';

export interface AIChatContext {
  subscription_price: number;
  lead_to_call_rate: number;
  target_cost_per_lead?: number;
  industry_average_ctr?: number;
}

export interface AICampaignAnalysisProps {
  campaignId: string;
  isActive?: boolean;
  chatContext: AIChatContext;
}

const AICampaignAnalysis: React.FC<AICampaignAnalysisProps> = ({
  campaignId,
  isActive = true,
  chatContext
}) => {
  const [isActivated, setIsActivated] = useState(!!isActive);
  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; leads: number }[]>([]);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('monthly');
  const chartRef = useRef<HTMLDivElement>(null);

  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  });

  useEffect(() => {
    if (campaignId && isActivated) {
      const fetchSummary = async () => {
        try {
          // Fetch campaign summary using the campaignId
          const result = await getCampaignSummary(campaignId);
          console.log('campaign summary in AI analysis:', result);
          setCampaignSummary(result);
        } catch (error) {
          console.error('Error fetching campaign summary:', error);
        }
      };
      void fetchSummary();
    }
  }, [campaignId, isActivated]);

  useEffect(() => {
    if (campaignId && isActivated) {
      const fetchHistoricalLeads = async () => {
        try {
          // Fetch historical leads using the campaignId
          const results = await getCampaignHistoricalLeadsResults(campaignId, 'last_month');
          const formattedData = results.lead_results.map(item => ({
            date: format(new Date(item.date), 'MMM d'),
            leads: item.leads
          }));
          setDailyData(formattedData);
        } catch (error) {
          console.error('Error fetching campaign data:', error);
        }
      };
      void fetchHistoricalLeads();
    }
  }, [campaignId, isActivated]);

  const refresh = useCallback(() => {
    setIsActivated(true);
  }, []);

  if (!isActivated) {
    return (
      <div className="flex h-96 items-center justify-center">
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600"
        >
          <RotateCw className="size-5" />
          View AI Analysis
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

  // Basic campaign metrics
  const costPerLead = campaignSummary.total_spent / campaignSummary.total_leads;
  const conversionRate = ((campaignSummary.total_leads / campaignSummary.clicks) * 100).toFixed(2);

  // Additional AI-driven metrics using chat context
  const expectedSalesCalls = Math.round(campaignSummary.total_leads * chatContext.lead_to_call_rate);
  const costPerSalesCall = costPerLead / chatContext.lead_to_call_rate;
  const breakevenConversionRate = ((costPerSalesCall / chatContext.subscription_price) * 100).toFixed(1);
  const maxMonthlyRevenue = expectedSalesCalls * chatContext.subscription_price;
  const potentialROI = (((maxMonthlyRevenue - campaignSummary.total_spent) / campaignSummary.total_spent) * 100).toFixed(1);

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
            AI Analysis: {campaignSummary.campaign_name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Created {format(new Date(campaignSummary.creation_date), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-green-500" />
          <span
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium',
              campaignSummary.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-500'
            )}
          >
            {campaignSummary.status}
          </span>
        </div>
      </div>

      {/* Campaign Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Leads & Calls</CardTitle>
            <Users className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{campaignSummary.total_leads}</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">
              Expected Calls: {expectedSalesCalls}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cost Analysis</CardTitle>
            <DollarSign className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
              €{costPerLead.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">
              Per lead • €{costPerSalesCall.toFixed(2)} per call
            </div>
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
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Potential Revenue</CardTitle>
            <TrendingUp className="size-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
              €{maxMonthlyRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-500">
              ROI: {potentialROI}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            AI Campaign Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Your campaign CTR of {campaignSummary.ctr.toFixed(2)}% is{' '}
            {campaignSummary.ctr > (chatContext.industry_average_ctr || 2) ? 'above' : 'below'} average. With{' '}
            {expectedSalesCalls} expected sales calls from {campaignSummary.total_leads} leads, your cost per sales call
            is €{costPerSalesCall.toFixed(2)}. To break even at €{chatContext.subscription_price} per subscription, you
            need to convert {breakevenConversionRate}% of sales calls. The campaign has reached{' '}
            {campaignSummary.reach.toLocaleString()} people with a frequency of {campaignSummary.frequency.toFixed(1)}.
          </p>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zinc-900 dark:text-zinc-200">Leads Over Time</CardTitle>
            <div className="space-x-2">
              <button
                onClick={() => setTimeRange('weekly')}
                className={cn(
                  'rounded-lg px-3 py-1 text-sm transition-colors',
                  timeRange === 'weekly'
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                )}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={cn(
                  'rounded-lg px-3 py-1 text-sm transition-colors',
                  timeRange === 'monthly'
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                )}
              >
                Monthly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeRange === 'weekly' ? dailyData.slice(-7) : dailyData}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} className="dark:stroke-zinc-500" />
                <YAxis stroke="#71717a" fontSize={12} className="dark:stroke-zinc-500" />
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
};

export default AICampaignAnalysis;
