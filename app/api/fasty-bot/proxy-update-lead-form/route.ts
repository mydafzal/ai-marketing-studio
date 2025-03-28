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
      campaign_creation_flow_session_id,
      form_template_name,
      form_name,
      form_title,
      form_description,
      thank_you_text,
      thank_you_page_title,
      data_usage_notice,
      custom_questions,
      privacy_policy_link,
      privacy_policy_link_text,
      locale,
      company_name,
      follow_up_url
    } = body

    // Make sure required fields are present
    if (!campaign_creation_flow_session_id) {
      return NextResponse.json(
        { error: 'Missing required field: campaign_creation_flow_session_id is required' },
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
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/update-lead-form`
    
    console.log('Updating lead form for campaign session:', campaign_creation_flow_session_id)
    
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
      method: 'POST',
      headers,
      body: JSON.stringify({
        campaign_creation_flow_session_id,
        form_template_name,
        form_name,
        form_title,
        form_description,
        thank_you_text,
        thank_you_page_title,
        data_usage_notice,
        custom_questions,
        privacy_policy_link,
        privacy_policy_link_text,
        locale,
        company_name,
        follow_up_url
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
      console.error('Lead form update failed:', errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to update lead form' },
        { status: response.status }
      )
    }

    // Return successful response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating lead form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}