import { NextResponse } from 'next/server'
import { getUserDetail } from '@/app/actions'
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(request: Request) {
  try {
    // Get user details and Facebook account ID
    const userDetail = await getUserDetail()
    const formData = await request.formData()
    const fbAccountId = userDetail?.user?.fbAccountId || '0'
    
    if (!fbAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Facebook account ID not found' 
      }, { status: 400 })
    }

    // Log all form data entries for debugging
    console.log('Received form data entries:')
    for (const [key, value] of Array.from(formData.entries())) {
      console.log(` - ${key}:`, typeof value, value)
    }
    
    // Extract key parameters from form data
    const file_size = formData.get('file_size')
    const videoFile = formData.get('file')
    const start_offset = formData.get('start_offset')
    const finish = formData.get('finish')
    const upload_session_id = formData.get('upload_session_id')
    const width = formData.get('widht') || formData.get('width')
    const height = formData.get('height')
    const campaign_session_id = formData.get('campaign_session_id')

    // Determine which endpoint to use
    const isInitializing = !!file_size && !videoFile
    const endpoint = isInitializing ? 'campaign-creation-flow/video-start' : 'campaign-creation-flow/video'
    
    // Create backend API URL
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/${endpoint}`
    
    console.log(`Using API URL: ${apiUrl}`)
    console.log(`Operation: ${isInitializing ? 'Initializing video upload' : 'Uploading video chunk'}`)
    
    // Prepare form data for backend
    const fbFormData = new FormData()
    fbFormData.append('fb_account_id', fbAccountId)
    
    // Add parameters based on operation type
    if (isInitializing) {
      // Initialize video upload
      if (!file_size) {
        return NextResponse.json({ 
          success: false, 
          error: 'File size is required' 
        }, { status: 400 })
      }
      
      console.log('File size type:', typeof file_size, 'Value:', file_size)
      const fileSizeValue = typeof file_size === 'string' ? file_size : String(file_size)
      
      // Debug before appending
      console.log('Appending file_size:', fileSizeValue)
      fbFormData.append('file_size', fileSizeValue)
      
      if (width) fbFormData.append('widht', String(width))
      if (height) fbFormData.append('height', String(height))
      if (campaign_session_id) fbFormData.append('campaign_session_id', String(campaign_session_id))
    } else {
      // Upload video chunk
      if (!videoFile || !upload_session_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'File and upload_session_id are required for chunk upload' 
        }, { status: 400 })
      }
      
      fbFormData.append('file', videoFile)
      fbFormData.append('start_offset', start_offset || '0')
      fbFormData.append('finish', finish || '0')
      fbFormData.append('upload_session_id', upload_session_id)
      
      if (width) fbFormData.append('widht', String(width))
      if (height) fbFormData.append('height', String(height))
      if (campaign_session_id) fbFormData.append('campaign_session_id', String(campaign_session_id))
    }
    
    // Get FB API Key
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    if (token_resp.success && token_resp.token) {
      token = token_resp.token
    }

    console.log('Making request with headers:', {
      'Authorization': 'Bearer [REDACTED]',
      'fb-api-key': token ? '[PRESENT]' : '[MISSING]'
    })
    
    // Make the request to the backend service
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token
      },
      body: fbFormData
    })

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Video upload error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        isInitializing,
        body: errorBody
      })
      
      return NextResponse.json({ 
        success: false,
        error: errorBody,
        details: {
          status: response.status,
          statusText: response.statusText,
          apiUrl: apiUrl
        }
      }, { status: response.status })
    }

    // Return successful response
    const data = await response.json()
    return NextResponse.json({ 
      success: true, 
      data: data 
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}