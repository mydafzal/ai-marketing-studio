import { NextResponse } from 'next/server'
import { getAdCreatives } from '@/lib/api/fasty-bot/get-adcreatives'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const campaignId = searchParams.get('campaignId')
    if (!campaignId){
      return NextResponse.json({ success: false, error:"campaignId is required" }, { status: 400 })
    }

    const response = await getAdCreatives(campaignId)

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error get adcreatives:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

