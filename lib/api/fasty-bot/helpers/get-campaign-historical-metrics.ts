// /lib/api/fasty-bot/get-campaign-historical-metrics.ts
export async function getCampaignHistoricalMetrics(
    campaignId: string,
    timeline = 'last_month',
    advancedMode = true
  ) {
    // Build query params
    const params = new URLSearchParams({
      campaign_id: campaignId,
      timeline,
      advanced_mode: advancedMode.toString()
    });
  
    // Call the Next.js route
    const response = await fetch(`/api/fasty-bot/get-campaign-historical-metrics?${params}`);
  
    if (!response.ok) {
      throw new Error(`Failed to fetch historical metrics: ${response.status}`);
    }
  
    // Return the JSON data to your component
    return response.json();
  }
  