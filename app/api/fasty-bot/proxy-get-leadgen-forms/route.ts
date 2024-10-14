import { NextResponse } from 'next/server'
import { getLeadgenForms } from '@/lib/api/fasty-bot/get-leadgen-forms'

export async function GET(request: Request) {
  try {

    const response = await getLeadgenForms(request)

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error get leadgen forms:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

