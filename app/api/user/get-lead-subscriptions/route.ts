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
    const subscribedCampaignsRaw = await kv.hget(userKey, 'subscribed_campaigns')
    
    // Use the robust parser to handle the data
    const subscribedCampaigns = parseSubscribedCampaigns(subscribedCampaignsRaw)
    
    return NextResponse.json({ subscribedCampaigns })
  } catch (error) {
    console.error('Error fetching lead subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead notification preferences' },
      { status: 500 }
    )
  }
}