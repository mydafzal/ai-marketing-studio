import {NextResponse} from 'next/server'
import { auth } from '@/auth'
import { encryptEmail } from '@/lib/email-encryption'
import { trackEvent } from '@/lib/utils'
import { Events } from '@/lib/posthog-events'

const enableBackendCall = true;

export async function POST(request: Request) {
    if (!enableBackendCall){
        return NextResponse.json({
            response:""
        })
    }
    try {
        const {website_link} = await request.json()

        if (!website_link) {
            return NextResponse.json({error: 'website_link is required'}, {status: 400})
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        const apiUrl = `${fastyEndpoint}/misc/grab-company-info-from-website`

        console.log("\n\n\n\---------------\n\n\n")

        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'x-api-key': `${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                website_link,
            })
        })

        if (!response.ok) {
            const errorBody = await response.json()
            console.error('Error setting status:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            })
            return NextResponse.json(
              { success: false, data: errorBody },
              { status: response.status }
            )
        }
        const data = await response.json()
        const session = await auth()
        const encryptedEmail = await encryptEmail(session?.user?.email || '');

        trackEvent(Events.WEBSITE_ANALYZED, {
            email: encryptedEmail,
            id: session?.user?.id || ''
          })
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error setting status:', error)
        return NextResponse.json({success: false}, {status: 500})
    }
}