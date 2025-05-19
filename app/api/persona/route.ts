import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      company_name,
      website_link,
      privacy_policy_link,
      preferred_language,
      location_data,
      website_data
    } = body

    if (!company_name || !website_link || !privacy_policy_link || !preferred_language) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const owner_id = session.user.id
    const owner_email = session.user.email
    const id = randomUUID()
    const personaKey = `persona:${id}`
    const userKey = `user:${owner_email}`

    const dataToSave = {
      id,
      owner_id,
      owner_email,
      company_name,
      website_link,
      privacy_policy_link,
      preferred_language,
      website_data: website_data || '',
      created_at: new Date().toISOString(),
      location_data: location_data ? JSON.stringify(location_data) : null
    }

    await kv.hset(personaKey, dataToSave)

    const userData = await kv.hgetall(userKey) || {}
    
    let persona_list: string[] = []
    try {
      if (userData?.persona_list) {
        const parsedList = userData.persona_list as string[]
        if (Array.isArray(parsedList)) {
          persona_list = parsedList
        }
      }
    } catch (error) {
      console.error('Error parsing existing persona_list:', error)
      persona_list = []
    }

    persona_list.push(id)

    await kv.hset(userKey, {
      ...userData,
      persona_list: JSON.stringify(persona_list)
    })

    return NextResponse.json({ success: true, data: dataToSave, message: 'Persona created successfully' })
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userKey = `user:${session.user.email}`
    const userData = await kv.hgetall(userKey)

    let persona_list: string[] = []
    try {
      persona_list = userData?.persona_list as string[]
      if (!Array.isArray(persona_list)) {
        persona_list = []
      }
    } catch (error) {
      console.error('Error parsing persona_list:', error)
      persona_list = []
    }

    if (persona_list.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Fetch all personas from the list
    const personas = []
    for (const personaId of persona_list) {
      const personaKey = `persona:${personaId}`
      const personaData = await kv.hgetall(personaKey)
      
      if (personaData) {
        if (personaData.location_data && typeof personaData.location_data === 'string') {
          try {
            personaData.location_data = JSON.parse(personaData.location_data)
          } catch (error) {
            console.error('Error parsing location_data:', error)
          }
        }
        personas.push(personaData)
      }
    }

    return NextResponse.json({ success: true, data: personas })
  } catch (error) {
    console.error('Error fetching personas:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}