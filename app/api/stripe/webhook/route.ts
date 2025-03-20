import Stripe from 'stripe'
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

// Define types
interface SubPayload {
  sub_email: string
  sub_trial_start?: Date | null
  sub_trial_end?: Date | null
  sub_status: string
  sub_current_period_start: Date | null
  sub_current_period_end: Date | null
  sub_offer: string
  sub_interval: string
  sub_product_id: string
  sub_interval_count: string | number
  sub_stripe_customer_id: string
  sub_id: string
}

interface CheckoutSessionData {
  customer_id: string
  customer_email: string
  session_id: string
  subscription_id: string
  price_id: string
  product_id: string
  amount_total: number
  currency: string
  payment_status: string
  subscription_status: string
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
const endpointSecret = process.env.STRIPE_WEBHOOK_PROD_SECRET || ''

// Helper functions
const fetchStripeCustomer = async (customerId: string) => {
  return (await stripe.customers.retrieve(customerId)) as Stripe.Customer
}

const fetchStripeProduct = async (productId: string) => {
  return await stripe.products.retrieve(productId)
}

const unixTimeStampToDateTime = (unixTimeStamp: number | null | undefined) => {
  return unixTimeStamp ? new Date(unixTimeStamp * 1000) : null
}

// Database operations
async function updateSubscriptionDetails(sub: SubPayload) {
  try {
    // Log important subscription info
    console.log(
        `Updating subscription for ${sub.sub_email}, status: ${sub.sub_status}`
    )

    const payload = {
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

    const userKey = `user:${sub.sub_email}`
    await kv.hset(userKey, payload)
    console.log(`Successfully updated subscription for ${sub.sub_email}`)
  } catch (error) {
    console.error(`Error updating subscription details:`, error)
    throw error // Re-throw to handle in the caller
  }
}

async function deleteSubscriptionDetails(email: string) {
  try {
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

    await kv.hdel(userKey, ...propertiesToDelete)
    console.log(`Successfully deleted subscription details for ${email}`)
  } catch (error) {
    console.error(`Error deleting subscription fields from KV store:`, error)
    throw error
  }
}

// Core subscription operations
const persistSubscription = async (subscription: any) => {
  try {
    const stripeCustomer = await fetchStripeCustomer(subscription.customer)
    const stripeProduct = await fetchStripeProduct(subscription.plan.product)

    if (!stripeCustomer.email) {
      console.error(`No email found for customer ID: ${subscription.customer}`)
      return
    }

    const subscriptionPayload: SubPayload = {
      sub_email: stripeCustomer.email,
      sub_status: subscription.status,
      sub_current_period_start: unixTimeStampToDateTime(
          subscription.current_period_start
      ),
      sub_current_period_end: unixTimeStampToDateTime(
          subscription.current_period_end
      ),
      sub_offer: stripeProduct.metadata.offer || stripeProduct.id,
      sub_interval: subscription.plan.interval,
      sub_product_id: subscription.plan.product,
      sub_interval_count: subscription.plan.interval_count,
      sub_stripe_customer_id: subscription.customer,
      sub_id: subscription.id
    }

    await updateSubscriptionDetails(subscriptionPayload)
  } catch (error) {
    console.error('Error persisting subscription:', error)
    throw error
  }
}

const handleSubscriptionDeleted = async (event: Stripe.Event) => {
  try {
    const subscription = event.data.object as Stripe.Subscription
    const stripeCustomer = await fetchStripeCustomer(
        subscription.customer as string
    )

    if (!stripeCustomer.email) {
      console.error(`No email found for customer ID: ${subscription.customer}`)
      return
    }

    await deleteSubscriptionDetails(stripeCustomer.email)
  } catch (error) {
    console.error('Error handling subscription deleted event:', error)
  }
}

const handleSubscriptionCreated = async (event: Stripe.Event) => {
  try {
    const subscription = event.data.object as Stripe.Subscription
    await persistSubscription(subscription)
  } catch (error) {
    console.error('Error handling subscription created event:', error)
  }
}

const handleSubscriptionUpdated = async (event: Stripe.Event) => {
  try {
    const subscription = event.data.object as Stripe.Subscription

    // Safely check previous attributes with proper typing
    const previousAttributes =
        (event.data.previous_attributes as { status?: string }) || {}

    // Check if status changed from incomplete to active
    if (
        subscription.status === 'active' &&
        previousAttributes.status === 'incomplete'
    ) {
      console.log('Subscription status changed from incomplete to active')
    }

    await persistSubscription(subscription)
  } catch (error) {
    console.error('Error handling subscription updated event:', error)
  }
}

const handleInvoicePaymentSucceeded = async (event: Stripe.Event) => {
  try {
    const invoice = event.data.object as Stripe.Invoice

    if (invoice.subscription) {
      // Just retrieve and persist the current subscription state
      const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
      )
      await persistSubscription(subscription)
      console.log(
          `Handled invoice payment succeeded for subscription ${invoice.subscription}`
      )
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded event:', error)
  }
}

const handleCheckoutSessionCompleted = async (event: Stripe.Event) => {
  try {
    const session = event.data.object as Stripe.Checkout.Session

    if (!session.customer || !session.customer_email || !session.subscription) {
      console.log('Missing required fields in checkout session')
      return
    }

    // If there's a subscription, fetch it and update details
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
      )

      // Since we have a successful checkout, we can mark this as active
      if (subscription) {
        await persistSubscription(subscription)
        console.log(
            `Updated subscription details from checkout session: ${session.id}`
        )
      }
    }

    console.log(`Handled checkout session completed for ${session.id}`)
  } catch (error) {
    console.error('Error handling checkout session completed event:', error)
  }
}

const handleEntitlementSummaryUpdated = async (event: Stripe.Event) => {
  // Handle entitlement summary updates if needed
}

const handleUnhandledEventType = (event: Stripe.Event) => {
  console.log(`Unhandled event type ${event.type}`)
}

// Main webhook handler
export async function POST(req: Request) {
  let event: Stripe.Event

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (error) {
    const message =
        error instanceof Error
            ? error.message
            : `Unknown Error ${JSON.stringify(error)}`

    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log(`Processing webhook event: ${event.type}`)

  try {
    // Handle Stripe event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break

      case 'entitlements.active_entitlement_summary.updated':
        await handleEntitlementSummaryUpdated(event)
        break

      default:
        handleUnhandledEventType(event)
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error)
    // Continue processing - don't fail the whole webhook
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true })
}