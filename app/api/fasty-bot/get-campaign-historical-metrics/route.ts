import { NextResponse } from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions'
import { auth } from '@/auth'
import { encryptEmail } from '@/lib/email-encryption'

export async function GET(request: Request) {
  try {
    // 1. Parse the query parameters
    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')
    const timeline = searchParams.get('timeline') ?? 'last_month'
    const advancedModeParam = searchParams.get('advanced_mode') ?? 'false'
    const advanced_mode = advancedModeParam === 'true'

    const session = await auth()
     if (!session?.user) {
       console.error('❌ Authentication failed - no valid user session');
       return NextResponse.json({error: 'Unauthorized'}, {status: 401})
     }

     const encryptedEmail = await encryptEmail(session.user.email || '')

    // Basic validation
    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: campaign_id' },
        { status: 400 }
      )
    }

    // 2. Construct the FastAPI URL
    // Replace FASTY_API_URL with your environment variable or actual URL
    const fastyApiUrl = process.env.FASTY_API_URL || 'http://localhost:8000'
    const endpointUrl = `${fastyApiUrl}/facebook/read/insights/get-all-campaign-historical-metrics?campaign_id=${campaign_id}&timeline=${timeline}&advanced_mode=${advanced_mode}&encrypted_email=${encryptedEmail}`

    // 3. Get the Facebook API key (assuming you have a helper that fetches it)
    const tokenResponse = await getFbMarketingApiKey()
    let fbApiKey = ''
    if (tokenResponse?.success && tokenResponse?.token) {
      fbApiKey = tokenResponse.token
    }

    // 4. Call the FastAPI endpoint
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        // FASTY_API_TOKEN is typically your internal token to authenticate with the Fasty server
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN ?? ''}`,
        // The FastAPI endpoint expects "fb_api_key" (see your HistoricalMetricsRequest docstring)
        'fb-api-key': fbApiKey,
        'encrypted_email': encryptedEmail
      },
    })

    // 5. Check for errors
    if (!response.ok) {
      console.error(`FastAPI error: ${response.status} - ${response.statusText}`)
      const errorBody = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Failed to fetch historical metrics', details: errorBody },
        { status: response.status }
      )
    }

    // 6. Return the FastAPI response as JSON
    const data = await response.json()
    return NextResponse.json(data)

  } catch (err) {
    console.error('Error in Next.js route:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: String(err) },
      { status: 500 }
    )
  }
}
