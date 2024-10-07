import { NextResponse } from 'next/server'
import { fetchChatFbCampaignId } from '@/app/actions'

export async function POST(request: Request) {
  try {
    const {
      chatSlug,
      name,
      status,
      objective,
      fb_account_id,
      special_ad_categories = ['NONE']
    } = await request.json()

    if (!name || !objective) {
      return NextResponse.json(
        { error: 'Campaign data are required' },
        { status: 400 }
      )
    }
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/campaign/create`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      },
      body: JSON.stringify({
        fb_account_id,
        name,
        status,
        objective,
        special_ad_categories
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Error create campaign:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      })
      return NextResponse.json({ success: false }, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error create campaign:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
