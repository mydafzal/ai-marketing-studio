
import { z } from 'zod';
import AICampaignAnalysis from '@/components/ai-campaign-analysis-board';
import { getCampaignSummary, type CampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary';
import { getCampaignHistoricalLeadsResults } from "@/lib/api/fasty-bot/get-historical-leads";
import React from 'react';
import { format } from 'date-fns';

interface AnalysisParams {
  campaignId: string;
  guideForUser?: string;
}

interface CampaignData extends CampaignSummary {
  historical_data: Array<{
    date: string;
    leads: number;
  }>;
}

const getAICampaignAnalysisModule = {
  description: 'Shows an AI-driven analysis of the campaign performance',
  parameters: z.object({
    campaignId: z.string().describe('The ID of the campaign to analyze'),
    guideForUser: z.string().optional().describe('Guide message to show below the analysis')
  }),
  component: async function ({ campaignId, guideForUser }: AnalysisParams) {
    const summaryData = await getCampaignSummary(campaignId);
    
    // Fetch historical data using the same method as campaign results
    const historicalResults = await getCampaignHistoricalLeadsResults(campaignId, 'last_month');
    
    // Transform historical data to match expected format
    const historicalData = historicalResults.lead_results.map(item => ({
      date: format(new Date(item.date), 'MMM d'),
      leads: item.leads
    }));

    // Combine summary and historical data
    const campaignData: CampaignData = {
      ...summaryData,
      historical_data: historicalData
    };
    
    return React.createElement(React.Fragment, null, [
      React.createElement(AICampaignAnalysis, { 
        campaignData: campaignData,
        key: 'analysis'
      }),
      React.createElement('div', { 
        className: 'my-4',
        key: 'guide'
      }, guideForUser)
    ]);
  }
};

export default getAICampaignAnalysisModule;