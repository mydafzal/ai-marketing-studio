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
    
    console.log(`Saving optimization subscriptions for ${userEmail}:`, subscribedCampaigns)
    
    // If array is empty, remove the key entirely
    if (subscribedCampaigns.length === 0) {
      try {
        await kv.hdel(userKey, 'subscribed_campaigns_for_creative_optimizations')
        console.log(`Successfully removed optimization subscriptions for ${userEmail}`)
      } catch (deleteError) {
        console.error(`Error removing optimization subscriptions for ${userEmail}:`, deleteError)
        throw deleteError // Rethrow to be caught by the outer try/catch
      }
    } else {
      // If we have campaigns to store, directly set the new value
      // This overwrites any existing value automatically
      try {
        await kv.hset(userKey, {
          subscribed_campaigns_for_creative_optimizations: JSON.stringify(subscribedCampaigns)
        })
        console.log(`Stored ${subscribedCampaigns.length} campaign IDs for ${userEmail}`)
      } catch (setError) {
        console.error(`Error storing campaign IDs for ${userEmail}:`, setError)
        throw setError // Rethrow to be caught by the outer try/catch
      }
    }
    
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