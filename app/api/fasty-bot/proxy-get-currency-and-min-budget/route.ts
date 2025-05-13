import { NextResponse } from 'next/server'
import { getFbMarketingApiKey, getUserDetail } from '@/app/actions'

// Define the interface for the expected API response
interface CurrencyBudgetResponse {
  name: string
  offset: number
  code: string
  min_daily_budget_with_offset: number
  min_daily_budget_without_offset: number
  min_daily_budget_without_offset_closest_int: number
  error: string | null
}

export async function GET(request: Request) {
  let fb_account_id: string | undefined;
  try {
    const userDetail = await getUserDetail();
    fb_account_id = userDetail?.user?.fbAccountId;
  } catch (err) {
    console.error('Failed to fetch user details:', err);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }

  const fastyEndpoint = process.env.FASTY_API_URL
  const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/get-currency-and-min-budget?fb_account_id=${fb_account_id}`

  const token_resp = await getFbMarketingApiKey()
  let token = ""
  if (token_resp.success && token_resp.token) {
    token = token_resp.token
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token
      }
    })

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      return NextResponse.json({ error: 'Failed to fetch currency and min budget' }, { status: response.status })
    }

    const data: CurrencyBudgetResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching currency and min budget:', error)
    return NextResponse.json({ error: 'Failed to fetch currency and min budget' }, { status: 500 })
  }
}
