import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { subscribedCampaigns } = body
    
    // Validate input
    if (!Array.isArray(subscribedCampaigns)) {
      return NextResponse.json(
        { error: 'Invalid input: subscribedCampaigns must be an array' },
        { status: 400 }
      )
    }
    
    const userEmail = session.user.email
    
    // Update user data in Redis
    const userKey = `user:${userEmail}`
    
    // Store the subscribed campaigns as a JSON string
    await kv.hset(userKey, {
      subscribed_campaigns_for_creative_optimizations: JSON.stringify(subscribedCampaigns)
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Campaign optimization preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating campaign optimization subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign optimization preferences' },
      { status: 500 }
    )
  }
}