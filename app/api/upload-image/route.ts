import { NextResponse } from 'next/server'
import { getUserDetail } from '@/app/actions'
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(request: Request) {
  try {
    const userDetail = await getUserDetail()

    const formData = await request.formData()

    const fbAccountId = userDetail?.user?.fbAccountId || '0' // Facebook Account ID
    if (!fbAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Facebook account ID not found' 
      }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const fbFormData = new FormData()
    
    // Get the image file from the request
    const file = formData.get('file')
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }
    
    // Get width and height from the request
    const width = formData.get('widht') // Note: keeping this typo to match the requirements
    const height = formData.get('height')
    const campaignSessionId = formData.get('campaign_session_id')
    
    // Append required parameters to the new form data
    fbFormData.append('file', file)
    fbFormData.append('widht', width || '1080')
    fbFormData.append('height', height || '1080')
    fbFormData.append('fb_account_id', fbAccountId)
    
    // If campaign_session_id is provided, append it
    if (campaignSessionId) {
      fbFormData.append('campaign_session_id', campaignSessionId)
    }

    // Get FB API key
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    if (token_resp.success && token_resp.token) {
      token = token_resp.token
    }

    // Make the request to the backend service
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/upload-image`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token
      },
      body: fbFormData
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Error uploading image:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      })
      return NextResponse.json({ 
        success: false,
        error: 'Failed to upload image'
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json({ 
      success: true, 
      image_hash: data.image_hash,
      campaign_session_id: data.campaign_session_id
    })
    
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}