import {NextResponse} from 'next/server'
import {createBaseLeadOrRecruitmentCampaign} from "@/lib/api/fasty-bot/create-base-lead-or-recruitment-campaign";

export async function POST(request: Request) {
  try {
    const {
      campaign_name="",
    } = await request.json()

    const response = await createBaseLeadOrRecruitmentCampaign({campaign_name})

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error creating base lead campaign:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
