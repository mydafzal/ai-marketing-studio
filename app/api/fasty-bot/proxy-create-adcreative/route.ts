
import { NextResponse } from 'next/server'
import { createAdCreative } from '@/lib/api/fasty-bot/create-adcreative'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const response = await createAdCreative(payload)

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error create adcreative:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

