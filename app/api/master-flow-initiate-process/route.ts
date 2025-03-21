import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserDetail } from '@/app/actions'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await req.json()
    
    // Get Facebook API key from header or use empty string to use internal API key
    const fbApiKey = req.headers.get('fb_api_key') || ''

    // Validate required fields
    const {
      fb_account_id,
      campaign_flow_session_id,
      profile_data,
      location_data,
      website_link,
      preferred_language,
      privacy_policy_link,
      page_id,
      image_hashes = [],
      video_ids = []
    } = body

    // Make sure required fields are present
    if (!fb_account_id || !campaign_flow_session_id || !website_link) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Make the request to the backend API using the specified URL structure
    const response = await fetch('http://localhost:8000/facebook/campaign-creation-flow/master-flow-initiate-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASTYBOT_API_KEY}`,
        'fb-api-key': fbApiKey
      },
      body: JSON.stringify({
        fb_account_id,
        campaign_flow_session_id,
        profile_data,
        location_data,
        website_link,
        preferred_language,
        privacy_policy_link,
        page_id,
        image_hashes,
        video_ids
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
      console.error('Master flow initiation failed:', errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to initiate master flow' },
        { status: response.status }
      )
    }

    // Return successful response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in master flow process:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}