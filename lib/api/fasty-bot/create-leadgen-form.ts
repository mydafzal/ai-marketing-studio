import { LeadgenFrom } from '@/lib/types'
import { getFbMarketingApiKey } from '@/app/actions';

interface LeadgenFromCreateRequest extends LeadgenFrom {
  page_id: string
}

export async function createLeadgenForm(
  payload: LeadgenFromCreateRequest
): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/lead/create-leadgen-form`
    payload['page_id'] = payload['page_id'] as string;
    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
        token=token_resp.token
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token

      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json();
    // Handle the response
    if (!response.ok) {
        console.error('Error in creating leadgen form:', {
            status: response.status,
            statusText: response.statusText,
            body: JSON.stringify(responseData)
        });
        return false;
    }
    if (responseData) {
      console.log('Successfully created leadgen form:', responseData);
      return responseData;
    } else {
        console.error('Unexpected response format:', responseData);
        return false;
    }

  } catch (error) {
    console.error('Error create leadgen form:', error)
    return false
  }
}
