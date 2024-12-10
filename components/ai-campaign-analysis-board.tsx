'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  Brain,
  DollarSign,
  Target,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary';
import { getCampaignHistoricalLeadsResults } from "@/lib/api/fasty-bot/get-historical-leads";
import { IconSpinner } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface HistoricalData {
  date: string;
  leads: number;
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
  campaignId: string;
  isActive?: boolean;
  context?: CampaignContext;
}

interface AIAnalysis {
  assessment: string;
  recommendations: {
    adPerformance: string;
    costOptimization: string;
    leadQuality: string;
  };
}

const AICampaignAnalysis: React.FC<AICampaignAnalysisProps> = ({ 
  campaignId,
  context = {},
  isActive
}) => {
  const [isActivated, setIsActivated] = useState(!!isActive);
  const [campaignData, setCampaignData] = useState<CampaignSummary | null>(null);
  const [dailyData, setDailyData] = useState<HistoricalData[]>([]);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('monthly');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);

  const generateAIAnalysis = useCallback(async (data: CampaignSummary) => {
    setIsLoadingAnalysis(true);
    try {
      // Use standard assumptions if not provided by client
      const subscriptionPrice = context.subscription_price !== undefined ? context.subscription_price : 50; 
      const leadToCallRate = context.lead_to_call_rate !== undefined ? context.lead_to_call_rate : 0.1;

      // Calculate key metrics for AI analysis
      const costPerLead = data.total_leads > 0 ? (data.total_spent / data.total_leads) : 0;
      const costPerClick = data.clicks > 0 ? (data.total_spent / data.clicks) : 0;
      const expectedSalesCalls = Math.round(data.total_leads * leadToCallRate);
      const costPerSalesCall = leadToCallRate > 0 ? costPerLead / leadToCallRate : 0;
      const breakevenConversionRate = ((costPerSalesCall / subscriptionPrice) * 100).toFixed(1);
      const leadConversionRate = data.clicks > 0 ? ((data.total_leads / data.clicks) * 100).toFixed(1) : '0';

      const prompt = `As a Meta Ads expert, analyze this campaign data and provide insights and recommendations. 
Do not use ### headings. Use simple text and bullet points. 
Always provide all sections, even if you must assume values. 
Provide actionable recommendations in each relevant section.

Campaign Metrics:
- CTR: ${data.ctr.toFixed(2)}%
- Cost per Lead: €${costPerLead.toFixed(2)}
- Cost per Click: €${costPerClick.toFixed(2)}
- Lead Conversion Rate: ${leadConversionRate}%
- Frequency: ${data.frequency.toFixed(1)}
- Total Reach: ${data.reach.toLocaleString()}
- Total Leads: ${data.total_leads}
- Total Spend: €${data.total_spent}
- Breakeven Conversion Rate Needed: ${breakevenConversionRate}%

Context:
${context.industry_average_ctr ? `- Industry Average CTR: ${context.industry_average_ctr}%` : '- Industry Average CTR: Assume a standard value like 2%'}
${context.target_cost_per_lead ? `- Target Cost per Lead: €${context.target_cost_per_lead}` : '- Target Cost per Lead: Assume €10'}
${context.previous_period_leads ? `- Previous Period Leads: ${context.previous_period_leads}` : '- Previous Period Leads: Assume previous period 30 leads'}
${context.previous_period_cost ? `- Previous Period Cost: €${context.previous_period_cost}` : '- Previous Period Cost: Assume previous period €300'}

Format your response EXACTLY as follows (include all four sections):
[Assessment]
(At least one paragraph describing the current state based on the metrics above.)

[Ad Performance]
(At least one paragraph or bullet points with actionable steps, for example:
- Create 3 new ad creatives focusing on a unique value proposition.
- Test different headlines and images.)

[Cost Optimization]
(At least one paragraph or bullet points with actionable steps.)

[Lead Quality & Conversion]
(At least one paragraph or bullet points with actionable steps.)

Do not omit any section. Even if data is lacking, assume reasonable values and provide meaningful advice.
Do not use headings like ### or multiple #, just plain text and bullet points if needed.
`;

      const response = await fetch('/api/analyze-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const result = await response.json();

      if (result.content) {
        const content = result.content;

        // Use [\s\S]*? to allow multiline matches without 's' flag
        const assessmentMatch = content.match(/\[Assessment\]([\s\S]*?)\[Ad Performance\]/);
        const adPerfMatch = content.match(/\[Ad Performance\]([\s\S]*?)\[Cost Optimization\]/);
        const costOptMatch = content.match(/\[Cost Optimization\]([\s\S]*?)\[Lead Quality & Conversion\]/);
        const leadQualityMatch = content.match(/\[Lead Quality & Conversion\]([\s\S]*)/);

        const assessment = assessmentMatch ? assessmentMatch[1].trim() : 'No assessment provided.';
        const adPerformance = adPerfMatch ? adPerfMatch[1].trim() : 'No ad performance recommendations provided.';
        const costOptimization = costOptMatch ? costOptMatch[1].trim() : 'No cost optimization recommendations provided.';
        const leadQuality = leadQualityMatch ? leadQualityMatch[1].trim() : 'No lead quality recommendations provided.';

        setAiAnalysis({
          assessment: assessment || 'No assessment provided.',
          recommendations: {
            adPerformance: adPerformance || 'No ad performance recommendations provided.',
            costOptimization: costOptimization || 'No cost optimization recommendations provided.',
            leadQuality: leadQuality || 'No lead quality recommendations provided.',
          }
        });
      } else {
        setAiAnalysis({
          assessment: 'No assessment provided.',
          recommendations: {
            adPerformance: 'No ad performance recommendations provided.',
            costOptimization: 'No cost optimization recommendations provided.',
            leadQuality: 'No lead quality recommendations provided.',
          }
        });
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setAiAnalysis({
        assessment: 'No assessment provided due to an error.',
        recommendations: {
          adPerformance: 'No ad performance recommendations due to an error.',
          costOptimization: 'No cost optimization recommendations due to an error.',
          leadQuality: 'No lead quality recommendations due to an error.',
        }
      });
    } finally {
      setIsLoadingAnalysis(false);
      setHasRunAnalysis(true);
    }
  }, [campaignId]); // Removed `context` from dependencies to fix lint warning.

  // Fetch campaign summary
  useEffect(() => {
    if (campaignId && isActivated && !hasRunAnalysis) {
      const fetchData = async () => {
        try {
          const result = await getCampaignSummary(campaignId);
          console.log('campaign summary in AI analysis', result);
          setCampaignData(result);
          
          if (result && !hasRunAnalysis) {
            await generateAIAnalysis(result);
          }
        } catch (error) {
          console.error('Error fetching campaign summary:', error);
        }
      };
      void fetchData();
    }
  }, [campaignId, isActivated, hasRunAnalysis, generateAIAnalysis]);

  // Fetch historical data
  useEffect(() => {
    if (campaignData && isActivated) {
      const fetchHistorical = async () => {
        try {
          const results = await getCampaignHistoricalLeadsResults(campaignData.campaign_id, 'last_month');
          const formattedData = results.lead_results.map(item => ({
            date: format(new Date(item.date), 'MMM d'),
            leads: item.leads
          }));
          setDailyData(formattedData);
        } catch (error) {
          console.error('Error fetching campaign data:', error);
        }
      };
      void fetchHistorical();
    }
  }, [campaignData, isActivated]);

  if (!isActivated) {
    return (
      <div className="flex h-96 items-center justify-center">
        <button
          onClick={() => setIsActivated(true)}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600"
        >
          <Brain className="size-5" />
          Run AI Analysis
        </button>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <IconSpinner className="size-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Use standard assumptions if not provided by client
  const subscriptionPrice = context.subscription_price !== undefined ? context.subscription_price : 50; 
  const leadToCallRate = context.lead_to_call_rate !== undefined ? context.lead_to_call_rate : 0.1;

  // Calculate metrics
  const costPerLead = campaignData.total_leads > 0 ? (campaignData.total_spent / campaignData.total_leads) : 0;
  const costPerClick = campaignData.clicks > 0 ? (campaignData.total_spent / campaignData.clicks) : 0;
  const expectedSalesCalls = Math.round(campaignData.total_leads * leadToCallRate);
  const costPerSalesCall = leadToCallRate > 0 ? costPerLead / leadToCallRate : 0;
  const breakevenConversionRate = (subscriptionPrice > 0) ? ((costPerSalesCall / subscriptionPrice) * 100).toFixed(1) : '0';
  const maxMonthlyRevenue = expectedSalesCalls * subscriptionPrice;
  const potentialROI = (campaignData.total_spent > 0) ? (((maxMonthlyRevenue - campaignData.total_spent) / campaignData.total_spent) * 100).toFixed(1) : '0';
  const leadConversionRate = (campaignData.clicks > 0) ? ((campaignData.total_leads / campaignData.clicks) * 100).toFixed(1) : '0';

  const performanceStatus = context.target_cost_per_lead
    ? costPerLead < context.target_cost_per_lead ? 'Healthy' : 'Needs Attention'
    : costPerLead < 8 ? 'Healthy' : 'Needs Attention';

  const currentData = timeRange === 'weekly' ? dailyData.slice(-7) : dailyData;
  const weeklyTrend = (currentData.length > 1 && currentData[0].leads > 0)
    ? (((currentData[currentData.length - 1].leads - currentData[0].leads) / currentData[0].leads) * 100).toFixed(1)
    : '0';

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
          <span className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            performanceStatus === 'Healthy'
              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500"
          )}>
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
            <div className="mt-1 flex items-center text-xs text-zinc-500">
              <TrendingUp className="mr-1 size-3" />
              {weeklyTrend}% weekly trend
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {leadConversionRate}% conversion rate
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
            <p className="mt-1 text-xs text-zinc-500">
              Cost per Lead
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              €{costPerClick.toFixed(2)} per click
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
            <p className="mt-1 text-xs text-zinc-500">
              Frequency: {campaignData.frequency.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              CTR: {campaignData.ctr.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Potential</CardTitle>
            <Target className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expectedSalesCalls}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Expected sales calls
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {breakevenConversionRate}% to break even
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
          {isLoadingAnalysis ? (
            <div className="flex items-center gap-2">
              <IconSpinner className="size-4 animate-spin" />
              <p className="text-sm text-zinc-500">Generating AI analysis...</p>
            </div>
          ) : aiAnalysis ? (
            <ReactMarkdown className="prose dark:prose-invert text-sm text-zinc-700 dark:text-zinc-300">
              {aiAnalysis.assessment}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-zinc-500">Analysis not available</p>
          )}
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
          {isLoadingAnalysis ? (
            <div className="flex items-center gap-2">
              <IconSpinner className="size-4 animate-spin" />
              <p className="text-sm text-zinc-500">Generating recommendations...</p>
            </div>
          ) : aiAnalysis ? (
            <>
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                <h3 className="font-medium text-green-600 dark:text-green-500">Ad Performance</h3>
                <ReactMarkdown className="prose dark:prose-invert mt-1 text-sm">
                  {aiAnalysis.recommendations.adPerformance}
                </ReactMarkdown>
              </div>
              
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                <h3 className="font-medium text-green-600 dark:text-green-500">Cost Optimization</h3>
                <ReactMarkdown className="prose dark:prose-invert mt-1 text-sm">
                  {aiAnalysis.recommendations.costOptimization}
                </ReactMarkdown>
              </div>
              
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                <h3 className="font-medium text-green-600 dark:text-green-500">Lead Quality & Conversion</h3>
                <ReactMarkdown className="prose dark:prose-invert mt-1 text-sm">
                  {aiAnalysis.recommendations.leadQuality}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500">Recommendations not available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lead Generation Trends</CardTitle>
              <div className="space-x-2">
                <button
                  onClick={() => setTimeRange('weekly')}
                  className={cn(
                    "rounded-lg px-3 py-1 text-sm transition-colors",
                    timeRange === 'weekly'
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  )}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeRange('monthly')}
                  className={cn(
                    "rounded-lg px-3 py-1 text-sm transition-colors",
                    timeRange === 'monthly'
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeRange === 'weekly' ? dailyData.slice(-7) : dailyData}>
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

        {/* Cost Efficiency Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
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
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">Average CPL</p>
                <p className="text-lg font-bold">€{costPerLead.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Potential ROI</p>
                <p className="text-lg font-bold">{potentialROI}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AICampaignAnalysis;
