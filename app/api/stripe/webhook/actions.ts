import { getUser } from '@/app/login/actions'
import { kv } from '@vercel/kv'
import { SubPayload } from './types'

export async function updateSubscriptionDetails(sub: SubPayload) {
  const existingUser = await getUser(sub.sub_email)

  // await kv.hmset(`user:${email}`, user)
  // return

  const userKey = `user:${sub.sub_email}`
  await kv.hset(userKey, {
    sub_trial_start: sub.sub_trial_start,
    sub_trial_end: sub.sub_trial_end,
    sub_status: sub.sub_status,
    sub_current_period_start: sub.sub_current_period_start,
    sub_current_period_end: sub.sub_current_period_end,
    sub_offer: sub.sub_offer,
    sub_interval: sub.sub_interval,
    sub_product_id: sub.sub_product_id,
    sub_interval_count: sub.sub_interval_count
  })
}
