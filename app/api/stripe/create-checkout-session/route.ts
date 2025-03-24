import { auth } from '@/auth'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { kv } from '@vercel/kv'
import { redirect } from 'next/navigation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(req: NextRequest) {
    // Programmatically retrive hostname.
  const headersList = headers()
  const host = headersList.get('host') || '' // Retrieves the hostname.
  const billingPageUrl = `http://${host}/subscription`
  let stripeSessionUrl
  try {
    const authSession = await auth()
    const customerEmail = authSession?.user?.email || ''

    const formData = await req.formData()
    const lookupKey = formData.get('lookup_key') as string
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product']
    })

    console.log('lookupkey ', lookupKey)
    const stripeSession = await stripe.checkout.sessions.create({
      // customer: customerId,
      customer_email: customerEmail,
      billing_address_collection: 'auto',
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1
        }
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      // consider using customer id as session id
      success_url: `${billingPageUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${billingPageUrl}?canceled=true`
    })

    // Store initial session data in KV
    await kv.hset(`checkout:${stripeSession.id}`, {
      session_id: stripeSession.id,
      customer_email: customerEmail,
      created_at: new Date().toISOString(),
      status: 'pending',
      price_id: prices.data[0].id,
      product_id: prices.data[0].product
    })

    console.log('stripeSessionUrl ', stripeSession.url)
    stripeSessionUrl = stripeSession.url as string
  } catch (error: unknown) {
    console.log(error)
    const message =
      error instanceof Error
        ? error.message
        : `Unknown Error ${JSON.stringify(error)}`
    // @Todo redirect to error page
    return NextResponse.json({ error: message }, { status: 500 })
    }

  if (stripeSessionUrl) {
    redirect(stripeSessionUrl)
  }
}
