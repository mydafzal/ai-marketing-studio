import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { auth } from '@/auth'

// Get a single persona by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const personaKey = `persona:${id}`
    const data = await kv.hgetall(personaKey)

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Persona not found' },
        { status: 404 }
      )
    }

    if (data.location_data && typeof data.location_data === 'string') {
      try {
        data.location_data = JSON.parse(data.location_data)
      } catch (e) {
        console.error('Error parsing location data:', e)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching persona:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Update a persona
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const personaKey = `persona:${id}`
    
    // Check if persona exists
    const existingData = await kv.hgetall(personaKey)
    if (!existingData) {
      return NextResponse.json(
        { success: false, error: 'Persona not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      name,
      company_name,
      website_link,
      privacy_policy_link,
      preferred_language,
      location_data
    } = body

    if (!company_name || !website_link || !privacy_policy_link || !preferred_language) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // If name is provided, use it; if not, keep existing name or generate a new one
    const profile_name = name || existingData.name || `${company_name} - profile (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;

    const updateData = {
      ...existingData,
      name: profile_name,
      company_name,
      website_link,
      privacy_policy_link,
      preferred_language,
      location_data,
      updated_at: new Date().toISOString()
    }

    if (location_data && Array.isArray(location_data)) {
      updateData.location_data = JSON.stringify(location_data)
    }

    await kv.hset(personaKey, updateData)

    if (updateData.location_data) {
      updateData.location_data = JSON.parse(updateData.location_data)
    }

    return NextResponse.json({
      success: true,
      data: updateData,
      message: 'Persona updated successfully'
    })
  } catch (error) {
    console.error('Error updating persona:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Delete a persona
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const personaKey = `persona:${id}`
    const persona = await kv.hgetall(personaKey)
    if (!persona) {
      return NextResponse.json(
        { success: false, error: 'Persona not found' },
        { status: 404 }
      )
    }

    if (persona.owner_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await kv.del(personaKey)

    const userData = await kv.hgetall(`user:${session.user.email}`)
    if (Array.isArray(userData?.persona_list)) {
      const updatedList = userData?.persona_list.filter((personaId: string) => personaId !== id)
      await kv.hset(`user:${session.user.email}`, {
        ...userData,
        persona_list: JSON.stringify(updatedList)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Persona deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting persona:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 