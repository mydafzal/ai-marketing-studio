import { getUser } from '@/app/login/actions'
import { kv } from '@vercel/kv'
import { SubPayload } from './types'

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
  const usertoUpdate = await getUser(email)

  if (!usertoUpdate || typeof usertoUpdate !== 'object') {
    throw new Error('Key not found or is not an object')
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

  // Step 2: Delete each property
  // propertiesToDelete.forEach(property => {
  //   delete usertoUpdate[property]
  // })

  // Step 3: Save the updated object back to KV
  // const userKey = `user:${email}`
  // await kv.set(userKey, usertoUpdate)
  // await kv.hset(userKey, usertoUpdate)

  // Use hdel to delete multiple fields from the Redis hash
  const userKey = `user:${email}`
  await kv.hdel(userKey, ...propertiesToDelete)
}
