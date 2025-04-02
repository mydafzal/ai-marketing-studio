import { NextResponse } from 'next/server'
import { getSearch } from '@/lib/api/fasty-bot/search'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 })
  }
  const paramsObject = Object.fromEntries(searchParams.entries())

  try {
    const data = await getSearch(paramsObject)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Failed to searching' }, { status: 500 })
  }
}
