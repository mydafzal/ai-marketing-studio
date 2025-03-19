import { getUser } from '@/app/login/actions'
import { kv } from '@vercel/kv'

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import stripe, { Stripe } from 'stripe'
import { SubPayload, CheckoutSessionData } from './types'

const webhookSecret = process.env.STRIPE_WEBHOOK_PROD_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new NextResponse('Webhook signature verification failed', { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Store checkout session data
        const sessionData: CheckoutSessionData = {
          customer_id: session.customer as string,
          customer_email: session.customer_email as string,
          session_id: session.id,
          subscription_id: session.subscription as string,
          price_id: session.line_items?.data[0]?.price?.id || '',
          product_id: session.line_items?.data[0]?.price?.product as string,
          amount_total: session.amount_total || 0,
          currency: session.currency || 'usd',
          payment_status: session.payment_status,
          subscription_status: 'active'
        }

        // Store in Vercel KV
        await kv.hset(`checkout:${session.id}`, sessionData)
        await kv.hset(`customer:${session.customer}`, {
          email: session.customer_email,
          customer_id: session.customer,
          latest_session_id: session.id
        })

        // Update subscription details
        if (session.customer_email) {
          const subPayload: SubPayload = {
            sub_email: session.customer_email,
            sub_trial_start: null,
            sub_trial_end: null,
            sub_status: 'active',
            sub_current_period_start: new Date(),
            sub_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            sub_offer: sessionData.product_id,
            sub_interval: 'month',
            sub_product_id: sessionData.product_id,
            sub_interval_count: '1',
            sub_stripe_customer_id: session.customer as string,
            sub_id: session.subscription as string
          }
          await updateSubscriptionDetails(subPayload)
        }
        break
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Webhook error', { status: 500 })
  }
}


export async function getSubscriptionDetails(email: string): Promise<SubPayload | null> {
  try {
    const userKey = `user:${email}`
    const subDetails = await kv.hgetall(userKey)
    return subDetails as SubPayload
  } catch (error) {
    console.error('Error fetching subscription details:', error)
    return null
  }
}

export async function updateSubscriptionDetails(sub: SubPayload) {
  const existingUser = await getUser(sub.sub_email)

  // await kv.hmset(`user:${email}`, user)
  // return

  const payload = {
    // sub_trial_start: sub.sub_trial_start,
    // sub_trial_end: sub.sub_trial_end,
    sub_status: sub.sub_status,
    sub_current_period_start: sub.sub_current_period_start,
    sub_current_period_end: sub.sub_current_period_end,
    sub_offer: sub.sub_offer,
    sub_interval: sub.sub_interval,
    sub_product_id: sub.sub_product_id,
    sub_interval_count: sub.sub_interval_count,
    sub_stripe_customer_id: sub.sub_stripe_customer_id,
    sub_id: sub.sub_id
  }

  console.log('payload: ', payload)

  const userKey = `user:${sub.sub_email}`
  await kv.hset(userKey, payload)
}

export async function deleteSubscriptionDetails(email: string) {
  const userKey = `user:${email}`
  const existingData = await kv.hgetall(userKey)

  if (!existingData || Object.keys(existingData).length === 0) {
    console.error(`User not found in KV store for key: ${userKey}`)
    return
  }

  // Properties to delete
  const propertiesToDelete = [
    'sub_status',
    'sub_current_period_start',
    'sub_current_period_end',
    'sub_offer',
    'sub_interval',
    'sub_product_id',
    'sub_interval_count',
    'sub_stripe_customer_id',
    'sub_id'
  ]

  try {
    await kv.hdel(userKey, ...propertiesToDelete)
  } catch (error) {
    console.error(`Error deleting subscription fields from KV store:`, error)
  }
}
