import { NextResponse } from "next/server"
import { getFbMarketingApiKey } from "@/app/actions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const fb_account_id = "act_1020650316366490" // Make sure this matches your account

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/ad-insights/get-all-ad-metrics-by-campaign-id?fb_account_id=${fb_account_id}&campaign_id=${campaignId}`

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
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in metrics endpoint:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}