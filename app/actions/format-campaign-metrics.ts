"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  creationDate?: string;
  status?: string;
  objective?: 'OUTCOME_TRAFFIC' | 'OUTCOME_LEADS' | 'OUTCOME_AWARENESS' | string;
  totalSpent?: number;
  totalLeads?: number;
  totalClicks?: number;
  totalImpressions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  frequency?: number;
  dailyBudget?: number;
  adMetrics?: Record<string, any>[];
  timeframe?: string;
}

/**
 * Formats campaign metrics into a natural, well-crafted message
 * for the AI to send to users in the chat.
 * 
 * @param metrics The campaign metrics to format
 * @param messageType The type of message to generate (e.g., 'summary', 'performance', 'creative_results')
 * @returns A natural language message describing the campaign metrics
 */
export async function formatCampaignMetrics(
  metrics: CampaignMetrics,
  messageType: 'summary' | 'performance' | 'creative_results' = 'summary'
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest GPT-4o model
      messages: [
        {
          role: "system",
          content: `You are a helpful marketing assistant that specializes in analyzing Facebook ad campaign metrics and presenting them in a clear, concise, and friendly manner.

Guidelines:
1. FOCUS ON RELEVANT METRICS: Emphasize the most important metrics based on the campaign objective.
2. BE CONCISE BUT INFORMATIVE: Communicate the key insights in a conversational, easy-to-understand way.
3. HIGHLIGHT PERFORMANCE: Note any particularly strong or weak performance areas.
4. AVOID JARGON: Explain metrics in simple terms that non-marketers can understand.
5. BE CONVERSATIONAL: Write as if you're having a direct conversation with the user.
6. MATCH TONE TO MESSAGE TYPE: For 'summary' be comprehensive, for 'performance' be analytical, for 'creative_results' focus on how ads are performing.

Formats:
- For ad creative results, focus on which ads are performing well, with what metrics, and potential insights.
- For performance messages, analyze trends and suggest possible next steps.
- For summary messages, give a complete but concise overview of campaign status.`
        },
        {
          role: "user",
          content: `Please format these campaign metrics into a natural, conversational message of type '${messageType}':
${JSON.stringify(metrics, null, 2)}

For reference:
- message_type: ${messageType}
- objective: ${metrics.objective || 'Unknown'}

Create a message I can send directly to the user that sounds natural and helpful.`
        }
      ],
      temperature: 0.7, // Slightly higher temperature for more natural language
      max_tokens: 500,
    })

    const formattedMessage = completion.choices[0]?.message?.content || ""
    return formattedMessage.trim()
  } catch (error) {
    console.error("Error formatting campaign metrics:", error)
    return `I've analyzed the campaign "${metrics.campaignName}" and found some interesting metrics. The campaign has spent €${metrics.totalSpent?.toFixed(2) || '0.00'} and generated ${metrics.totalClicks || 0} clicks${metrics.totalLeads ? ` and ${metrics.totalLeads} leads` : ''}.`
  }
}

/**
 * Specifically formats ad creative results into a natural message
 * 
 * @param campaignName The name of the campaign
 * @param adCreatives Array of ad creative metrics
 * @returns A natural language message describing the ad creative performance
 */
export async function formatAdCreativeResults(
  campaignName: string,
  adCreatives: Record<string, any>[]
): Promise<string> {
  try {
    // Create a simplified metrics object with just the necessary fields
    const metrics: CampaignMetrics = {
      campaignId: adCreatives[0]?.id || '',
      campaignName: campaignName,
      adMetrics: adCreatives.map(ad => ({
        creativeId: ad.id,
        name: ad.name || ad.creativeName,
        status: ad.status,
        type: ad.type,
        impressions: ad.metrics?.impressions,
        clicks: ad.metrics?.inlineLinkClicks,
        ctr: ad.metrics?.inlineLinkClickRate,
        cpc: ad.metrics?.costPerClick,
        spend: ad.metrics?.spend,
        actions: ad.metrics?.engagement || 0,
        reach: ad.metrics?.reach,
        frequency: ad.metrics?.frequency,
        leads: ad.metrics?.leads,
        conversions: ad.metrics?.conversions,
        costPerLead: ad.metrics?.costPerLead,
        watchTime: ad.metrics?.watchTime,
        message: ad.object_story_spec?.video_data?.message || ad.object_story_spec?.link_data?.message
      }))
    };

    // Include the raw metrics data as a stringified JSON for more detailed analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest GPT-4o model
      messages: [
        {
          role: "system",
          content: `You are a helpful marketing assistant that specializes in analyzing Facebook ad campaign metrics and presenting them in a clear, concise, and friendly manner.

Guidelines:
1. FOCUS ON RELEVANT METRICS: Emphasize the most important metrics based on the campaign objective.
2. BE CONCISE BUT INFORMATIVE: Communicate the key insights in a conversational, easy-to-understand way.
3. HIGHLIGHT PERFORMANCE: Note any particularly strong or weak performance areas.
4. AVOID JARGON: Explain metrics in simple terms that non-marketers can understand.
5. BE CONVERSATIONAL: Write as if you're having a direct conversation with the user.
6. COMPARISON: Compare performance between different ad creatives.`
        },
        {
          role: "user",
          content: `Please format these campaign creative metrics into a natural, conversational message:

STRUCTURED DATA:
${JSON.stringify(metrics, null, 2)}

RAW METRICS DATA:
${JSON.stringify(adCreatives.map(ad => {
  // Extract just the key metrics to keep the payload size manageable
  return {
    id: ad.id,
    name: ad.name || ad.creativeName,
    status: ad.status,
    type: ad.type,
    metrics: ad.metrics,
    messageContent: ad.object_story_spec?.video_data?.message || ad.object_story_spec?.link_data?.message
  };
}), null, 2)}

Create a message that sounds natural and helpful. Include insights about which ad creatives are performing best and why. This message will be added directly to the chat as an AI assistant message.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const formattedMessage = completion.choices[0]?.message?.content || "";
    return formattedMessage.trim();
  } catch (error) {
    console.error("Error formatting ad creative results:", error);
    return `I've analyzed the ad creatives for campaign "${campaignName}" and found ${adCreatives.length} different ads with varying performance. You can view the detailed metrics in the sidebar.`;
  }
}