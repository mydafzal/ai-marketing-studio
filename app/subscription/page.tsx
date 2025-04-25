import { kv } from '@vercel/kv'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserDetail } from '@/app/actions'
import { SidebarDesktop } from '@/components/sidebar-desktop'
import { Subscription } from '@/components/subscription/subscription'
import Stripe from 'stripe'
import { InvoiceItem } from '@/components/subscription/payment-history'
import { subscriptionBypassList } from './subscription-bypass-list'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export const metadata = {
  title: 'Reeply Subscription'
}

const fetchInvoices = async (
  customerId: string | undefined
): Promise<InvoiceItem[]> => {
  if (!customerId) return []
  
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 5
  })
  return invoices.data.map(i => {
    return {
      date: unixTimeStampToDateTime(i.created)!,
      invoiceNumber: i.id,
      amount: i.amount_due
    }
  })
}

const handleCancelSubscription = async () => {
  'use server'
  const userDetail = await getUserDetail()
  const user = userDetail.user
  if (user && user.sub_id) {
    await stripe.subscriptions.cancel(user.sub_id)
  }
}

const unixTimeStampToDateTime = (unixTimeStamp: number) => {
  // convert timestamp to milliseconds and construct Date object
  return unixTimeStamp ? new Date(unixTimeStamp * 1000) : null
}

export default async function SubscriptionPage({ searchParams }: { searchParams: { canceled?: string } }) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  const userEmail = session?.user?.email
  
  if (!userEmail) {
    redirect('/login')
  }

  if (userEmail && subscriptionBypassList.includes(userEmail)) {
    redirect('/')
  }
  
  // Check for cancelled checkout and handle it
  if (searchParams.canceled === 'true') {
    const userKey = `user:${userEmail}`
    const userData = await kv.hgetall(userKey)
    
    // If this was a pending trial checkout that was cancelled, clean up
    if (userData?.pending_trial_checkout_session) {
      // User cancelled the checkout, clean up pending trial data
      await kv.hdel(userKey, 'pending_trial_checkout_session', 'pending_trial_checkout_created')
      console.log(`User ${userEmail} cancelled checkout, cleared pending trial data`)
    }
  }
  
  // Get user details for the subscription page
  const userDetail = await getUserDetail()
  const user = userDetail.user
  
  if (!user) {
    redirect('/login')
  }
  
  // Remove the redirect - allow users with active/trial subscriptions to access this page

  const invoices = await fetchInvoices(user?.sub_stripe_customer_id)
  
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      <Subscription
        user={user}
        invoices={invoices}
        handleCancelSubscription={handleCancelSubscription}
        checkoutCanceled={searchParams.canceled === 'true'}
      />
    </div>
  )
}