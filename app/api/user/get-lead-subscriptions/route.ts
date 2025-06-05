import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

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
      } catch (e) {
        console.error('Error parsing subscribed campaigns JSON:', e)
      }
    }
    
    return NextResponse.json({ subscribedCampaigns })
  } catch (error) {
    console.error('Error fetching lead subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead notification preferences' },
      { status: 500 }
    )
  }
}