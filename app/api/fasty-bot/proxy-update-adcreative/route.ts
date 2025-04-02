import { NextResponse } from 'next/server'
import { updateAdCreative } from '@/lib/api/fasty-bot/update-adcreative'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload?.id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const response = await updateAdCreative(payload)

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error update adcreative:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}