export type SubPayload = {
  sub_email: string
  sub_trial_start: Date | null
  sub_trial_end: Date | null
  sub_status: string
  sub_current_period_start: Date
  sub_current_period_end: Date
  sub_offer: string
  sub_interval: string
  sub_product_id: string
  sub_interval_count: string
  sub_stripe_customer_id: string
  sub_id: string
}

export type CheckoutSessionData = {
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