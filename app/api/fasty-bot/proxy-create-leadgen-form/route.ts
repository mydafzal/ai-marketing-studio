import { NextResponse } from 'next/server'
import { createLeadgenForm } from '@/lib/api/fasty-bot/create-leadgen-form'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload?.page_id) {
      return NextResponse.json(
        { error: 'page_id are required' },
        { status: 400 }
      )
    }

    const response = await createLeadgenForm(payload)

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error create leadgen:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
