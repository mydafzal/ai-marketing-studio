import { getCampaignIdFromUrl } from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";

async function getCampaignHistoricalLeadsResults(
  campaignId: string,
  timeline: 'today' | 'last_week' | 'last_month' | 'last_year'
): Promise<{
  campaign_id: string;
  timeline: string;
  lead_results: Array<{ date: string; leads: number }>;
}> {
  let fetchedCampaignId =
    campaignId || (await getCampaignIdFromUrl())?.toString() || '0';

  // Check if mock data should be returned
  if (process.env.NEXT_PUBLIC_MOCK_CHART_DATA === '1') {
    return getMockData(fetchedCampaignId, timeline);
  }

  // Check for hardcoded mode
  if (
    process.env.NEXT_PUBLIC_HARDCODED_MODE === '1' &&
    process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID
  ) {
    fetchedCampaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID;
  }

  // If the campaign ID is '0', return immediately with an empty lead_results array
  if (fetchedCampaignId === '0') {
    return {
      campaign_id: fetchedCampaignId,
      timeline: timeline,
      lead_results: [],
    };
  }

  // Determine if the code is running on the server
  const isServer = typeof window === 'undefined';

  // Use absolute URL on the server and relative URL on the client
  const baseUrl = isServer ? process.env.NEXT_PUBLIC_API_BASE_URL : '';

  const apiUrl = `${baseUrl}/api/fasty-bot/proxy-get-historical-leads?campaign_id=${fetchedCampaignId}&timeline=${timeline}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return {
        campaign_id: fetchedCampaignId,
        timeline: timeline,
        lead_results: [],
      };
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching historical leads data:', error);
    return {
      campaign_id: fetchedCampaignId,
      timeline: timeline,
      lead_results: [],
    };
  }
}

function getMockData(campaignId: string, timeline: string) {
  const startDate = new Date('2024-06-26');
  const endDate = new Date('2024-07-25');
  const leadResults = [];

  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {
    leadResults.push({
      date: d.toISOString().split('T')[0],
      leads: Math.floor(Math.random() * 5000) + 1000, // Random number between 1000 and 6000
    });
  }

  return {
    campaign_id: campaignId,
    timeline: timeline,
    lead_results: leadResults,
  };
}

export { getCampaignHistoricalLeadsResults };
