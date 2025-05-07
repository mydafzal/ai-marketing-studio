import { NextResponse } from "next/server"
import { getFbMarketingApiKey } from "@/app/actions"
import { auth } from "@/auth"
import { encryptEmail } from "@/lib/email-encryption"
import { trackEvent } from "@/lib/utils"
import { Events } from "@/lib/posthog-events"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Accept both parameter formats for backward compatibility
    const campaignId = searchParams.get("campaignId") || searchParams.get("campaign_id")
    
    // Use the Facebook account ID 
    const fbAccountId = searchParams.get("fb_account_id")

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/ad-insights/get-all-ad-metrics-by-campaign-id?fb_account_id=${fbAccountId}&campaign_id=${campaignId}`

    const tokenResponse = await getFbMarketingApiKey()
    let token = ""
    if (tokenResponse?.success && tokenResponse?.token) {
      token = tokenResponse.token
    }

    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${process.env.FASTY_API_TOKEN}`,
        "fb-api-key": token,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    const session = await auth()
    const encryptedEmail = await encryptEmail(session?.user?.email || '');

    trackEvent(Events.AD_CREATIVES_ANALYZED, {
        email: encryptedEmail,
        id: session?.user?.id || ''
      })  
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in metrics endpoint:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}