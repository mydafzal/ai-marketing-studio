import { kv } from '@vercel/kv'

/**
 * Parses the subscribed campaigns from various possible formats
 * @param raw The raw value from KV store
 * @returns A properly formatted array of campaign IDs
 */
export function parseSubscribedCampaigns(raw: any): string[] {
  if (!raw) return []

  // Already an array? Great!
  if (Array.isArray(raw)) {
    return raw.map(id => String(id).trim())
  }

  // If string, attempt to parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(id => String(id).trim())
    } catch (_) {}

    // Try fixing single-quote formatting
    try {
      const fixed = raw
        .replace(/^\[\s*'/, '["')
        .replace(/'\s*,\s*'/g, '","')
        .replace(/'\s*\]$/, '"]')
      const parsed = JSON.parse(fixed)
      if (Array.isArray(parsed)) return parsed.map(id => String(id).trim())
    } catch (_) {}

    // Try plain CSV
    try {
      if (raw.includes(',') && !raw.includes('[')) {
        const items = raw.split(',').map(s => s.trim())
        if (items.every(Boolean)) return items
      }
    } catch (_) {}
  }

  console.warn('❌ Could not parse subscribed campaigns:', raw)
  return []
}

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
    const subscribedCampaignsRaw = await kv.hget(userKey, 'subscribed_campaigns')
    
    // Use the robust parser to handle the data
    const subscribedCampaigns = parseSubscribedCampaigns(subscribedCampaignsRaw)
    
    // Normalize all campaign IDs to ensure consistent comparison
    return subscribedCampaigns.map(id => normalizeCampaignId(id))
  } catch (error) {
    console.error('Error fetching lead subscriptions:', error)
    return []
  }
}