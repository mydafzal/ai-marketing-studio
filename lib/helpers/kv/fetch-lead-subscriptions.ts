import { kv } from '@vercel/kv'

/**
 * Normalizes a campaign ID to ensure consistent comparison
 * @param id Any campaign ID value
 * @returns Normalized string ID
 */
export function normalizeCampaignId(id: any): string {
  return String(id).trim();
}

/**
 * Fetches the user's subscribed campaigns from Redis
 * @param userEmail The user's email address
 * @returns An array of campaign IDs that the user is subscribed to
 */
export async function fetchLeadSubscriptions(userEmail: string): Promise<string[]> {
  try {
    if (!userEmail) {
      throw new Error('User email is required')
    }
    
    const userKey = `user:${userEmail}`
    const subscribedCampaignsJson = await kv.hget(userKey, 'subscribed_campaigns')
    
    // Parse the JSON string or return an empty array if not found
    let subscribedCampaigns: string[] = []
    
    if (subscribedCampaignsJson) {
      try {
        subscribedCampaigns = JSON.parse(subscribedCampaignsJson as string)
        
        // Ensure it's an array
        if (!Array.isArray(subscribedCampaigns)) {
          subscribedCampaigns = []
        }
        
        // Normalize all campaign IDs to ensure consistent comparison
        subscribedCampaigns = subscribedCampaigns.map(id => normalizeCampaignId(id))
      } catch (e) {
        console.error('Error parsing subscribed campaigns JSON:', e)
      }
    }
    
    return subscribedCampaigns
  } catch (error) {
    console.error('Error fetching lead subscriptions:', error)
    return []
  }
}