import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFbMarketingApiKey } from '@/app/actions';

export async function PUT(req: NextRequest) {
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
    
    // Create payload with only updatable fields
    // form_name, form_template_name, and any privacy_policy_link related fields should NOT be included
    const payload: any = {
      campaign_creation_flow_session_id
    };
    
    // Only add fields that were provided, excluding non-updatable fields
    if (form_title !== undefined) payload.form_title = form_title;
    if (form_description !== undefined) payload.form_description = form_description;
    if (thank_you_text !== undefined) payload.thank_you_text = thank_you_text;
    if (thank_you_page_title !== undefined) payload.thank_you_page_title = thank_you_page_title;
    if (data_usage_notice !== undefined) payload.data_usage_notice = data_usage_notice;
    if (custom_questions !== undefined) payload.custom_questions = custom_questions;
    if (locale !== undefined) payload.locale = locale;
    if (company_name !== undefined) payload.company_name = company_name;
    
    // follow_up_url should only be forwarded if explicitly provided in request
    // The client component will only send this if it has been changed
    if (follow_up_url !== undefined && body.hasOwnProperty('follow_up_url')) {
      payload.follow_up_url = follow_up_url;
    }
    
    console.log('Sending payload to update lead form:', payload);
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
      console.error('Lead form update failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      return NextResponse.json(
        { 
          success: false,
          error: errorData.error || 'Failed to update lead form',
          status: response.status,
          statusText: response.statusText
        },
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