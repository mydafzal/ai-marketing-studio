import { NextResponse } from "next/server"
import { getFbMarketingApiKey } from "@/app/actions" // or wherever you get tokens from

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const campaign_id = searchParams.get("campaign_id")

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 })
  }

  // Make sure you have FASTY_API_URL set in your .env (e.g. "http://localhost:8000")
  const fastyEndpoint = process.env.FASTY_API_URL
  if (!fastyEndpoint) {
    return NextResponse.json({ error: "FASTY_API_URL is not configured" }, { status: 500 })
  }

  // Construct the final Fasty endpoint
  // E.g. http://localhost:8000/facebook/read/ad-insights/get-all-ad-metrics-by-campaign-id?campaign_id=123
  const url = `${fastyEndpoint}/facebook/read/ad-insights/get-all-ad-metrics-by-campaign-id?campaign_id=${campaign_id}`

  let fbApiKey = ""
  try {
    // If you have a server-side function for retrieving your Facebook marketing token
    const tokenResp = await getFbMarketingApiKey()
    if (tokenResp?.success && tokenResp?.token) {
      fbApiKey = tokenResp.token
    }
  } catch (error) {
    console.error("Error retrieving FB API Key:", error)
  }

  try {
    // Proxy the request to Fasty
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN || ""}`,
        "fb-api-key": fbApiKey,
      },
    })

    if (!response.ok) {
      console.error("Fasty responded with:", response.status)
      return NextResponse.json({ error: "Fasty request failed" }, { status: response.status })
    }

    // Return the JSON response directly
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from Fasty:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
