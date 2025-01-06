'use client';
import React, { useState } from 'react';
import { format } from 'date-fns';
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
  TrendingUp,
  DollarSign,
  MessageSquare,
  AlertCircle,
  TrendingDown,
  BarChart,
  Target,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HistoricalData {
  date: string;
  leads: number;
}

interface CampaignData {
  campaign_id: string;
  campaign_name: string;
  total_leads: number;
  total_spent: number;
  ctr: number;
  frequency: number;
  impressions: number;
  reach: number;
  unique_clicks: number;
  clicks: number;
  creation_date: string;
  status: string;
  historical_data: HistoricalData[];
}

interface CampaignContext {
  subscription_price?: number;
  lead_to_call_rate?: number;
  target_cost_per_lead?: number;
  industry_average_ctr?: number;
  previous_period_leads?: number;
  previous_period_cost?: number;
}

interface AICampaignAnalysisProps {
  campaignData: CampaignData;
  context?: CampaignContext;
}

const AICampaignAnalysis: React.FC<AICampaignAnalysisProps> = ({ 
  campaignData, 
  context = {}
}) => {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('monthly');
  
  // Fallback values if context properties are undefined
  const subscriptionPrice = context.subscription_price || 0;
  const leadToCallRate = context.lead_to_call_rate || 0;

  // Calculate key metrics
  const costPerLead = campaignData.total_spent / campaignData.total_leads;
  const costPerClick = campaignData.total_spent / campaignData.clicks;
  const expectedSalesCalls = Math.round(campaignData.total_leads * leadToCallRate);
  const costPerSalesCall = costPerLead / leadToCallRate;
  const breakevenConversionRate = (costPerSalesCall / subscriptionPrice * 100).toFixed(1);
  const maxMonthlyRevenue = expectedSalesCalls * subscriptionPrice;

  // Calculate ROI metrics
  const potentialROI = ((maxMonthlyRevenue - campaignData.total_spent) / campaignData.total_spent * 100).toFixed(1);
  const leadConversionRate = (campaignData.total_leads / campaignData.clicks * 100).toFixed(1);

  // Performance assessments
  const performanceStatus = (() => {
    if (context.target_cost_per_lead) {
      return costPerLead < context.target_cost_per_lead ? 'Healthy' : 'Needs Attention';
    }
    return costPerLead < 8 ? 'Healthy' : 'Needs Attention';
  })();
  const performanceColor = performanceStatus === 'Healthy' ? 'green' : 'yellow';

  // CTR assessment
  const ctrAssessment = (() => {
    if (context.industry_average_ctr) {
      if (campaignData.ctr > context.industry_average_ctr * 1.2) return "excellent";
      if (campaignData.ctr > context.industry_average_ctr) return "good";
      return "below average";
    }
    return campaignData.ctr > 2 ? "good" : "needs improvement";
  })();

  // Engagement assessment
  const engagementAssessment = (() => {
    if (campaignData.frequency < 2) return "could be increased";
    if (campaignData.frequency > 4) return "might be too high";
    return "optimal";
  })();

  // Lead growth assessment
  const leadGrowthAssessment = (() => {
    if (context.previous_period_leads) {
      const growth = ((campaignData.total_leads - context.previous_period_leads) / context.previous_period_leads) * 100;
      return {
        percentage: growth.toFixed(1),
        status: growth > 0 ? "increased" : "decreased"
      };
    }
    return null;
  })();

  // Cost efficiency assessment
  const costEfficiencyAssessment = (() => {
    if (context.previous_period_cost) {
      const previousCostPerLead = context.previous_period_cost / context.previous_period_leads!;
      const costEfficiencyChange = ((costPerLead - previousCostPerLead) / previousCostPerLead * 100).toFixed(1);
      return {
        percentage: costEfficiencyChange,
        status: Number(costEfficiencyChange) < 0 ? "improved" : "declined"
      };
    }
    return null;
  })();

  return (
    <div className="space-y-6 p-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
            AI Analysis: {campaignData.campaign_name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Campaign Status: {campaignData.status} • Last updated {format(new Date(), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-green-500" />
          <span className={`rounded-full px-3 py-1 text-sm font-medium bg-${performanceColor}-100 text-${performanceColor}-700`}>
            {performanceStatus}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Generation</CardTitle>
            <Users className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignData.total_leads}
            </div>
            <p className="text-xs text-zinc-500">
              {leadGrowthAssessment 
                ? `${leadGrowthAssessment.status} by ${leadGrowthAssessment.percentage}%`
                : `${leadConversionRate}% conversion rate`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Analysis</CardTitle>
            <DollarSign className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{costPerLead.toFixed(2)}
            </div>
            <p className="text-xs text-zinc-500">
              Cost per Lead
              {costEfficiencyAssessment && 
                ` • ${costEfficiencyAssessment.status} by ${costEfficiencyAssessment.percentage}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Reach</CardTitle>
            <Eye className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignData.reach.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-500">
              Frequency: {campaignData.frequency.toFixed(1)} • CTR: {campaignData.ctr.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Potential</CardTitle>
            <Target className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expectedSalesCalls}
            </div>
            <p className="text-xs text-zinc-500">
              Expected sales calls • {breakevenConversionRate}% to break even
            </p>
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
            Your campaign&apos;s CTR of {campaignData.ctr.toFixed(2)}% is {ctrAssessment}, with an ad frequency that is {engagementAssessment}. 
            {leadGrowthAssessment && ` Lead generation has ${leadGrowthAssessment.status} by ${leadGrowthAssessment.percentage}% compared to the previous period. `}
            Your cost per lead is €{costPerLead.toFixed(2)}, requiring a {breakevenConversionRate}% 
            conversion rate of sales calls to break even on your €{subscriptionPrice} subscription price.
            {costEfficiencyAssessment && ` Cost efficiency has ${costEfficiencyAssessment.status} by ${costEfficiencyAssessment.percentage}%.`}
          </p>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <h3 className="font-medium text-green-600 dark:text-green-500">Ad Performance</h3>
            <p className="mt-1 text-sm">
              {ctrAssessment === "excellent" 
                ? "Your CTR is performing exceptionally well above industry standards."
                : `Your CTR of ${campaignData.ctr.toFixed(2)}% shows ${ctrAssessment} engagement.`}
              {campaignData.frequency > 3 
                ? " Consider refreshing ad creatives to prevent ad fatigue."
                : " Current ad frequency suggests room for increased exposure."}
              {" "}With a reach of {campaignData.reach.toLocaleString()} users, 
              {campaignData.reach < 50000 
                ? " there may be opportunities to expand your audience."
                : " you're maintaining strong market presence."}
            </p>
          </div>
          
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <h3 className="font-medium text-green-600 dark:text-green-500">Cost Optimization</h3>
            <p className="mt-1 text-sm">
              {costPerLead > (context.target_cost_per_lead || 8)
                ? `Current cost per lead (€${costPerLead.toFixed(2)}) is above target. Consider optimizing targeting or ad creative to improve efficiency.`
                : `Cost per lead of €${costPerLead.toFixed(2)} is within acceptable range.`}
              {" "}With a cost per click of €${costPerClick.toFixed(2)}, 
              {costPerClick > 0.5 
                ? " focus on improving ad relevance to reduce costs."
                : " you're achieving efficient click costs."}
              {potentialROI && ` Potential ROI at current rates: ${potentialROI}%.`}
            </p>
          </div>
          
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <h3 className="font-medium text-green-600 dark:text-green-500">Lead Quality & Conversion</h3>
            <p className="mt-1 text-sm">
              Your lead-to-call rate of {(leadToCallRate * 100).toFixed(1)}% suggests
              {leadToCallRate < 0.15 
                ? " there's room to improve lead quality through better qualification."
                : " you're generating well-qualified leads."} 
              To achieve profitability, aim to convert at least {breakevenConversionRate}% of sales calls.
              {leadConversionRate && Number(leadConversionRate) < 10 
                ? " Consider adjusting your lead form to better qualify prospects."
                : " Your lead form is effectively qualifying potential customers."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lead Generation Trends</CardTitle>
            <div className="space-x-2">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`rounded-lg px-3 py-1 text-sm ${
                  timeRange === 'weekly' ? 'bg-green-100 text-green-700' : 'bg-zinc-100'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`rounded-lg px-3 py-1 text-sm ${
                  timeRange === 'monthly' ? 'bg-green-100 text-green-700' : 'bg-zinc-100'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={campaignData.historical_data}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                />
                <XAxis 
                  dataKey="date"
                  className="text-xs text-zinc-600 dark:text-zinc-400"
                />
                <YAxis 
                  className="text-xs text-zinc-600 dark:text-zinc-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
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
