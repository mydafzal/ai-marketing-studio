import Stripe from 'stripe'
import { Mutex } from 'async-mutex'
import { updateSubscriptionDetails } from './actions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const subscriptionMutex = new Mutex()

const fetchStripeCustomer = async customerId => {
  const customer = await stripe.customers.retrieve(customerId)
  return customer
}

const fetchStripeProduct = async productId => {
  const product = await stripe.products.retrieve(productId)
  return product
}

// const persistSubscription = async subscription => {
//   console.log('persist subscription')
// }

const persistSubscription = async subscription => {
  await subscriptionMutex.runExclusive(async () => {
    const stripeCustomer = await fetchStripeCustomer(subscription.customer)
    const stripeProduct = await fetchStripeProduct(subscription.plan.product)

    const subscriptionPayload = {
      sub_email: stripeCustomer.email,
      sub_trial_start: unixTimeStampToDateTime(subscription.trial_start),
      sub_trial_end: unixTimeStampToDateTime(subscription.trial_end),
      sub_status: subscription.status,
      sub_current_period_start: unixTimeStampToDateTime(
        subscription.current_period_start
      ),
      sub_current_period_end: unixTimeStampToDateTime(
        subscription.current_period_end
      ),
      sub_offer: stripeProduct.metadata.offer,
      sub_interval: subscription.plan.interval,
      sub_product_id: subscription.plan.product,
      sub_interval_count: subscription.plan.interval_count
    }

    // Create or update subscription in Supabase
    await updateSubscriptionDetails(subscriptionPayload)
  })
}

const unixTimeStampToDateTime = unixTimeStamp => {
  // convert timestamp to milliseconds and construct Date object
  return unixTimeStamp ? new Date(unixTimeStamp * 1000) : null
}

export async function POST(req) {
  let event
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    // console.log("Webhook triggered", event);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Unknown Error ${JSON.stringify(error)}`

    // console.log(`⚠️  Webhook signature verification failed.`, message);
    return Response.json({ error: message }, { status: 400 })
  }

  //    handle Stripe event
  switch (event.type) {
    case 'customer.subscription.trial_will_end':
      handleTrialWillEnd(event)
      break
    case 'customer.subscription.deleted':
      handleSubscriptionDeleted(event)
      break
    case 'customer.subscription.created':
      handleSubscriptionCreated(event)
      break
    case 'customer.subscription.updated':
      handleSubscriptionUpdated(event)
      break
    case 'entitlements.active_entitlement_summary.updated':
      handleEntitlementSummaryUpdated(event)
      break
    default:
      handleUnhandledEventType(event)
  }

  // Return a 200 response to acknowledge receipt of the event
  return Response.json({ received: true })
}

const handleTrialWillEnd = async event => {}
const handleSubscriptionDeleted = async event => {}
const handleSubscriptionCreated = async event => {
  console.log('in subscription creaated', event.data.object)
  const subscription = event.data.object
  persistSubscription(subscription)
}
const handleSubscriptionUpdated = async event => {
  console.log('in subscription updated', event.data.object)
  const subscription = event.data.object
  persistSubscription(subscription)
}
const handleEntitlementSummaryUpdated = async event => {
  const subscription = event.data.object
  // console.log(`Active entitlement summary updated for ${subscription}.`);
}

const handleUnhandledEventType = async event => {
  console.log(`Unhandled event type ${event.type}.`)
}
