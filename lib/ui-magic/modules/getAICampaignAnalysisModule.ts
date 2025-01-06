import { z } from 'zod';
import AICampaignAnalysis from '@/components/ai-campaign-analysis-board';
import React from 'react';

interface AnalysisParams {
  campaignId: string;
  guideForUser?: string;
}

const getAICampaignAnalysisModule = {
  description: 'Shows an AI-driven analysis of the campaign performance',
  parameters: z.object({
    campaignId: z.string().describe('The ID of the campaign to analyze'),
    guideForUser: z.string().optional().describe('Guide message to show below the analysis')
  }),
  component: async function ({ campaignId, guideForUser }: AnalysisParams) {
    return React.createElement(React.Fragment, null, [
      React.createElement(AICampaignAnalysis, { 
        campaignId: campaignId,
        isActive: true,
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