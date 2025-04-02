import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(req: NextRequest) {
  let portalSessionUrl
  try {
    // Programmatically retrieve hostname
    const headersList = headers()
    const host = headersList.get('host') // Retrieves the hostname
    const billingPageUrl = `http://${host}/subscription`

    const body = await req.json()
    const customer_id = body.customer_id as string  // Ensure we use customer_id instead of session_id
    // const customer_id =  "cus_RxWrHmPlJfgNIy"

    if (!customer_id) {
      throw new Error("Customer ID is required for Stripe portal access")
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: billingPageUrl
    })

    portalSessionUrl = portalSession.url
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : `Unknown Error ${JSON.stringify(error)}`
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ url: portalSessionUrl }) // Send response instead of redirecting
}
