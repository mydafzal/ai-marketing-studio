import { NextResponse } from 'next/server'
import { trackServerEvent } from '@/lib/server-only/posthog-server'

export async function POST(req: Request) {
  const body = await req.json()

  try {
    if(process.env.NODE_ENV == "production"){
      await trackServerEvent(body)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
