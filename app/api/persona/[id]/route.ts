import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

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

    // Parse location_data if it exists
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

    const updateData: any = {
      ...existingData,
      company_name,
      website_link,
      privacy_policy_link,
      preferred_language,
      updated_at: new Date().toISOString()
    }

    if (location_data && Array.isArray(location_data)) {
      updateData.location_data = JSON.stringify(location_data)
    }

    await kv.hset(personaKey, updateData)

    // Parse location_data back for response
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
    const { id } = params
    const personaKey = `persona:${id}`
    
    // Check if persona exists
    const exists = await kv.exists(personaKey)
    if (!exists) {
      return NextResponse.json(
        { success: false, error: 'Persona not found' },
        { status: 404 }
      )
    }

    await kv.del(personaKey)

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