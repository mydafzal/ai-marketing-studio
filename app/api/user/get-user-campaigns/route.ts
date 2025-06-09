import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFbMarketingApiKey } from '@/app/actions'

export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userEmail = session.user.email
    const userKey = `user:${userEmail}`
    
    // Get user details from Redis including fbAccountId
    const user = await kv.hgetall(userKey)
    
    if (!user || !user.fbAccountId) {
      return NextResponse.json({ 
        error: 'No Facebook account ID found for this user',
        campaigns: [] 
      }, { status: 200 })
    }
    
    const fbAccountId = user.fbAccountId as string
    
    // Fetch campaigns using the user's fbAccountId
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/insights/get-campaigns?account_id=${fbAccountId}`
    
    // Get the user's Facebook token
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    
    // If the user has a token, use it
    if(token_resp.success && token_resp.token){
        token = token_resp.token
    }
    
    // Set up headers
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
    };
    
    // Only add the fb-api-key header if we have a token
    if (token) {
        headers['fb-api-key'] = token;
    }
    
    // Fetch campaigns from Fasty API
    const response = await fetch(apiUrl, { headers })
    
    if (!response.ok) {
      console.error(`HTTP error fetching campaigns! status: ${response.status}`);
      return NextResponse.json({ 
        error: 'Failed to fetch campaigns from Facebook',
        campaigns: [] 
      }, { status: 200 })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error fetching user campaigns:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch campaigns',
      campaigns: [] 
    }, { status: 200 })
  }
}