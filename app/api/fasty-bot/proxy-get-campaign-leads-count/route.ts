import { NextResponse } from 'next/server'
import { getCampaignLeadsCount } from '@/lib/api/fasty-bot/get-campaign-leads-count';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const data = await getCampaignLeadsCount(campaignId)

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, data: [] }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch campaign leads count',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}