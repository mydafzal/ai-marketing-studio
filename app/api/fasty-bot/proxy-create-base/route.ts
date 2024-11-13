import { NextResponse } from 'next/server'
import { createBase } from '@/lib/api/fasty-bot/create-base';

export async function POST(request: Request) {
  try {
    const {
      campaign_name="",
    } = await request.json()

    const response = await createBase({campaign_name})

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
