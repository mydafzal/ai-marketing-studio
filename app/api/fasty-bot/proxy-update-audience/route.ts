import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFbMarketingApiKey } from '@/app/actions';

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
    
    // Validate required fields
    const {
      campaign_session_uuid,
      audience_nr
    } = body

    // Make sure required fields are present
    if (!campaign_session_uuid || !audience_nr) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_session_uuid and audience_nr are required' },
        { status: 400 }
      )
    }

    // Get FB API key
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    if (token_resp.success && token_resp.token) {
      token = token_resp.token
    }

    // Make the request to the backend API
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/update-audience`
    
    console.log('Updating audience for campaign session:', campaign_session_uuid)
    
    // Prepare headers - for admin-assigned accounts, don't send any token
    // The Fasty backend will use its system token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
    };
    
    // Only add the fb-api-key header if we have a token
    if (token) {
      headers['fb-api-key'] = token;
    }
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
      console.error('Audience update failed:', errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to update audience' },
        { status: response.status }
      )
    }

    // Return successful response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating audience:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}