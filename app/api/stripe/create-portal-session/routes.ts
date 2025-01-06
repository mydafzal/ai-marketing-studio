import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(req: NextRequest) {
  let portalSessionUrl
  try {
    // Programmatically retrive hostname
    const headersList = headers()
    const host = headersList.get('host') // Retrieves the hostname
    //   @Todo change http to http for production build
    const billingPageUrl = `http://${host}/subscription`

    const formData = await req.formData()
    const session_id = formData.get('session_id') as string
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)

    const portaSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer as string,
      return_url: billingPageUrl
    })

    portalSessionUrl = portaSession.url

    console.log('portaSessionUrl: ', portalSessionUrl)
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : `Unknown Error ${JSON.stringify(error)}`
    return NextResponse.json({ error: message }, { status: 500 })
  }

  if (portalSessionUrl) {
    redirect(portalSessionUrl)
  }
}
