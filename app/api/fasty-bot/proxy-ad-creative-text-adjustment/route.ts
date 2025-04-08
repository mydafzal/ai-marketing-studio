import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { campaign_session_id, fb_account_id, title, message } =
      await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Headline and description are required' },
        { status: 400 }
      )
    }

    if (!campaign_session_id) {
      return NextResponse.json(
        { success: false, message: 'Campaign session ID is required' },
        { status: 400 }
      )
    }

    if (!fb_account_id) {
      return NextResponse.json(
        { success: false, message: 'Facebook account ID is required' },
        { status: 400 }
      )
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    if (!fastyEndpoint) {
      throw new Error('FASTY_API_URL environment variable is not defined')
    }

    const fastyToken = process.env.FASTY_API_TOKEN
    if (!fastyToken) {
      throw new Error('FASTY_API_TOKEN environment variable is not defined')
    }

    // Call the Fasty API to update the creative text
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/update-creatives-content`
    const requestBody = {
      campaign_session_id,
      fb_account_id,
      title,
      message
    }

    console.log('Calling Fasty API with payload:', JSON.stringify(requestBody))
    
    const fastyResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fastyToken}`
      },
      body: JSON.stringify(requestBody)
    })

    // Handle API response
    if (!fastyResponse.ok) {
      const errorData = await fastyResponse.json().catch(() => ({}))
      console.error('Fasty API error:', fastyResponse.status, errorData)
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to update ad creative text on Fasty API', 
          status: fastyResponse.status,
          error: errorData
        },
        { status: fastyResponse.status }
      )
    }

    // Parse the successful response
    const responseData = await fastyResponse.json()
    
    /* 
    Expected successful response structure:
    {
      "success": true,
      "creatives": [
        {
          "creative_id": "673907521855802",
          "name": "Reeply_LG_India_AIKampagne_April_2025_video_1",
          "success": true,
          "preview_uuid": "bc953314-ef0b-4e14-ae28-6081b20450bb",
          "is_image": false,
          "is_video": true
        }
      ]
    }
    */

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error updating ad creative text:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update ad creative text',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
