import { auth } from '@/auth'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { kv } from '@vercel/kv'
import { redirect } from 'next/navigation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(req: NextRequest) {
  // Programmatically retrieve hostname
  const headersList = headers()
  const host = headersList.get('host') || '' // Retrieves the hostname
  const billingPageUrl = `http://${host}/subscription`
  let stripeSessionUrl

  try {
    const authSession = await auth()
    const customerEmail = authSession?.user?.email || ''

    if (!customerEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const formData = await req.formData()
    const lookupKey = formData.get('lookup_key') as string
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product']
    })

    // Check if customer has had a trial before - using multiple sources for redundancy
    let hasHadTrialBefore = false

    // First, check if there's a record in KV storage indicating this user has had a trial
    const userKey = `user:${customerEmail}`
    const userData = await kv.hgetall(userKey)
    
    if (userData && (userData.has_had_trial === true || userData.has_had_trial === 'true')) {
      hasHadTrialBefore = true
      console.log(`User ${customerEmail} has had a trial before according to KV store`)
    }
    
    // If not found in KV, check Stripe records
    if (!hasHadTrialBefore) {
      // Check if the customer exists in Stripe
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      })

      if (customers.data.length > 0) {
        const customerId = customers.data[0].id

        // Search for trial periods in subscription history
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 100,
          status: 'all' // Get all subscriptions: active, past, canceled
        })

        // Check if any subscription had a trial
        hasHadTrialBefore = subscriptions.data.some(sub =>
            sub.trial_end !== null || sub.trial_start !== null
        )

        // If found in Stripe but not in KV, update KV for future reference
        if (hasHadTrialBefore) {
          await kv.hset(userKey, { has_had_trial: true })
          console.log(`Updated KV store to mark ${customerEmail} as having had a trial`)
        }

        console.log(`Customer ${customerEmail} has had a trial before according to Stripe: ${hasHadTrialBefore}`)
      }
    }

    console.log('lookupkey ', lookupKey)

    // Create checkout session with or without trial
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: customerEmail,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1
        }
      ],
      automatic_tax: {
        enabled: true,
      },
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${billingPageUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${billingPageUrl}?canceled=true`,
    }

    // Only add trial for yearly plans, not for monthly plans
    if (!hasHadTrialBefore && lookupKey.includes('yearly')) {
      checkoutParams.subscription_data = {
        trial_period_days: 7
      }
    }

    const stripeSession = await stripe.checkout.sessions.create(checkoutParams)

    // Store initial session data in KV
    await kv.hset(`checkout:${stripeSession.id}`, {
      session_id: stripeSession.id,
      customer_email: customerEmail,
      created_at: new Date().toISOString(),
      status: 'pending',
      price_id: prices.data[0].id,
      product_id: prices.data[0].product,
      includes_trial: !hasHadTrialBefore && lookupKey.includes('yearly')
    })
    
    // Store the checkout session ID in the user record for tracking
    // We'll only mark has_had_trial true when checkout completes
    if (!hasHadTrialBefore && lookupKey.includes('yearly')) {
      await kv.hset(userKey, { 
        pending_trial_checkout_session: stripeSession.id,
        pending_trial_checkout_created: new Date().toISOString()
      })
      console.log(`Created pending trial checkout session ${stripeSession.id} for ${customerEmail}`)
    }

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