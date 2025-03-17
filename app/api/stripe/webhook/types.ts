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
