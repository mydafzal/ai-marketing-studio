import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/app/actions'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('User-Agent')
    if (userAgent !== 'vercel-cron/1.0') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with subscribed campaigns
    const userKeys = await kv.keys('user:*')
    const realUserKeys = userKeys.filter(key => {
      const value = key.replace('user:', '')
      return value.includes('@') // crude but effective filter for real users
    })

    if (!userKeys || userKeys.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found'
      })
    }

    const subscribers = []

    // Process each user to check for subscriptions
    for (const userKey of realUserKeys) {
      try {
        const userEmail = userKey.replace('user:', '')
        let subscribedCampaignsraw: string | null = await kv.hget(
          userKey,
          'subscribed_campaigns_for_creative_optimizations'
        )

        let subscribedCampaigns = []
        try {
          subscribedCampaigns = parseSubscribedCampaigns(subscribedCampaignsraw)
        } catch (e) {
          console.error(
            `Error parsing subscribed campaigns for ${userEmail}:`,
            e
          )
          continue
        }

        // Get user details to get the fb_account_id and fb_api_key
        const userDetailsResponse = await getUserByEmail(userEmail)
        if (!userDetailsResponse.success || !userDetailsResponse.user) {
          continue
        }

        const user = userDetailsResponse.user
        const fbAccountId = user.fbAccountId
        const fbApiKey = user.fbMarketingApiKey

        // Skip users without required Facebook credentials
        if (!fbAccountId || !fbApiKey) {
          continue
        }

        // Add each campaign subscription to the subscribers array
        for (const campaignId of subscribedCampaigns) {
          subscribers.push({
            fb_account_id: fbAccountId,
            campaign_id: campaignId,
            user_email: userEmail,
            fb_api_key: fbApiKey
          })
        }
      } catch (userError) {
        console.error(`Error processing user ${userKey}:`, userError)
        // Continue with next user
      }
    }

    // If no subscribers found, return early
    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers found'
      })
    }

    // Call the FastyBot endpoint to check for leads and notify subscribers
    const fastyApiUrl = process.env.FASTY_API_URL || 'http://localhost:8000'
    const response = await fetch(
      `${fastyApiUrl}/facebook/dashboard/optimize-campaigns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.FASTY_API_TOKEN || ''}`
        },
        body: JSON.stringify({
          subscribers,
          dry_run: true // todo: remove dry run later on
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('FastyBot error:', errorData)
      return NextResponse.json(
        {
          success: false,
          error: 'Error calling FastyBot endpoint',
          details: errorData
        },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: `Successfully ran optimizations for ${subscribers.length} campaign subscriptions`,
      total_subscribers: result?.total_subscribers || 0,
      scanned_subscribers: result?.scanned_subscribers || 0,
      emails_sent: result?.emails_sent || 0,
      dry_run: true // for now keep dry run true
    })
  } catch (error) {
    console.error('Error in campaign optimization ruleset cron:', error)
    return NextResponse.json(
      { error: 'Failed to process campaign optimizations' },
      { status: 500 }
    )
  }
}

function parseSubscribedCampaigns(raw: any): string[] {
  if (!raw) return []

  // Already an array? Great!
  if (Array.isArray(raw)) {
    return raw
  }

  // If string, attempt to parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch (_) {}

    // Try fixing single-quote formatting
    try {
      const fixed = raw
        .replace(/^\[\s*'/, '["')
        .replace(/'\s*,\s*'/g, '","')
        .replace(/'\s*\]$/, '"]')
      const parsed = JSON.parse(fixed)
      if (Array.isArray(parsed)) return parsed
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