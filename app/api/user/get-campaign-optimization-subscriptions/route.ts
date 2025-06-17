import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parseSubscribedCampaigns } from '@/lib/helpers/kv/fetch-lead-subscriptions'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userEmail = session.user.email
    const userKey = `user:${userEmail}`
    
    // Get subscribed campaigns from Redis
    try {
      const subscribedCampaignsRaw = await kv.hget(userKey, 'subscribed_campaigns_for_creative_optimizations')
      
      console.log(`Fetching optimization subscriptions for ${userEmail}:`, subscribedCampaignsRaw)
      
      // Check if the key exists
      if (subscribedCampaignsRaw === null) {
        console.log(`No subscriptions found for ${userEmail} - returning empty array`)
        return NextResponse.json({ subscribedCampaigns: [] })
      }
      
      // Use the robust parser to handle the data
      const subscribedCampaigns = parseSubscribedCampaigns(subscribedCampaignsRaw)
      
      console.log(`Parsed optimization subscriptions:`, subscribedCampaigns)
      
      return NextResponse.json({ subscribedCampaigns })
    } catch (fetchError) {
      console.error(`Error fetching subscriptions for ${userEmail}:`, fetchError)
      // Return empty array on error
      return NextResponse.json({ subscribedCampaigns: [] })
    }
  } catch (error) {
    console.error('Error fetching campaign optimization subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign optimization preferences' },
      { status: 500 }
    )
  }
}