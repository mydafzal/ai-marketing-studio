import { NextResponse } from 'next/server'
import { getAdsets } from '@/lib/api/fasty-bot/get-adsets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const response = await getAdsets(campaignId)
    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }
    const data = await response.json()
    
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error fetching adsets:', error)
    return NextResponse.json({ error: 'Failed to fetch adsets' }, { status: 500 })
  }
}