import { NextResponse } from 'next/server'
import { getReachEstimate } from '@/lib/api/fasty-bot/reach-estimate'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targeting_spec = searchParams.get('targeting_spec')
  const filters = searchParams.get('filters')

  if (!targeting_spec || !filters) {
    return NextResponse.json({ error: 'Targeting_spec, filters are required' }, { status: 400 })
  }
  const paramsObject = Object.fromEntries(searchParams.entries())

  try {
    const data = await getReachEstimate(paramsObject)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reach estimate:', error)
    return NextResponse.json({ error: 'Failed to get reach estimate' }, { status: 500 })
  }
}
