import { NextResponse } from 'next/server'
import { createCampaign } from '@/lib/api/fasty-bot/create-campaign';

export async function POST(request: Request) {
  try {
    const {
      name,
      status,
      objective,
      fbAccountId,
      special_ad_categories = ['NONE']
    } = await request.json()

    if (!name || !objective) {
      return NextResponse.json(
        { error: 'Campaign data are required' },
        { status: 400 }
      )
    }
    
    const response = await createCampaign({
      name,
      objective,
      status,
      special_ad_categories,
      fbAccountId
    })

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error create campaign:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
