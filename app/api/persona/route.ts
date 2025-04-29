import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import axios from 'axios'
import { db } from '@/lib/db'
import { personaOwners } from '@/db/schema'
import { eq } from 'drizzle-orm'

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
    const id = randomUUID()
    const personaKey = `persona:${id}`

    const dataToSave: any = {
      id,
      owner_id,
      company_name,
      website_link,
      privacy_policy_link,
      preferred_language,
      website_data: website_data || '',
      created_at: new Date().toISOString(),
    }
    if (location_data && Array.isArray(location_data) && location_data.length > 0) {
      dataToSave.location_data = JSON.stringify(location_data)
    } else {
      dataToSave.location_data = null
    }

    // Save persona to KV
    await kv.hset(personaKey, dataToSave)

    // Create persona owner relationship directly using Drizzle
    try {
      await db.insert(personaOwners).values({
        personaId: id,
        ownerId: owner_id.toString()
      });
    } catch (error) {
      console.error('Error creating persona owner relationship:', error)
      // Delete the persona from KV if persona owner creation fails
      await kv.del(personaKey)
      throw new Error('Failed to create persona owner relationship')
    }

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

    // First, get all persona IDs owned by the current user from PostgreSQL
    const ownerRelations = await db
      .select({ personaId: personaOwners.personaId })
      .from(personaOwners)
      .where(eq(personaOwners.ownerId, session.user.id.toString()))

    if (!ownerRelations.length) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Extract persona IDs
    const personaIds = ownerRelations.map(relation => relation.personaId)

    const personas = []
    for (const personaId of personaIds) {
      const personaKey = `persona:${personaId}`
      const data = await kv.hgetall(personaKey)
      if (data) {
        // Parse location_data if present
        if (data.location_data && typeof data.location_data === 'string') {
          try {
            data.location_data = JSON.parse(data.location_data)
          } catch {}
        }
        personas.push(data)
      }
    }

    return NextResponse.json({ success: true, data: personas })
  } catch (error) {
    console.error('Error fetching personas:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ success: false, error: 'Persona ID is required' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const personaKey = `persona:${id}`
    const persona = await kv.hgetall(personaKey)

    if (!persona) {
      return NextResponse.json({ success: false, error: 'Persona not found' }, { status: 404 })
    }

    // Delete persona owner relationship directly using Drizzle
    try {
      await db.delete(personaOwners)
        .where(
          eq(personaOwners.personaId, id)
        );
    } catch (error) {
      console.error('Error deleting persona owner relationship:', error)
      throw new Error('Failed to delete persona owner relationship')
    }

    // Delete persona from KV
    await kv.del(personaKey)

    return NextResponse.json({ success: true, message: 'Persona deleted successfully' })
  } catch (error) {
    console.error('Error deleting persona:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
} 