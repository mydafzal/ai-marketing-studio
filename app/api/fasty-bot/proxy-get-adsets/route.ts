import { NextResponse } from 'next/server'
import { getAdsets } from '@/lib/api/fasty-bot/get-adsets';
import {storeFbFetchedObject} from "@/app/actions";

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

    const responseData = await response.json()

    // Store each adset in KV
    if (responseData.data && Array.isArray(responseData.data)) {
      for (const adset of responseData.data) {
        await storeFbFetchedObject('adset', adset.id, adset)
      }
    }

    // Just return the array directly to match what the component expects
    return NextResponse.json(responseData.data)
  } catch (error: unknown) {
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch adsets',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}