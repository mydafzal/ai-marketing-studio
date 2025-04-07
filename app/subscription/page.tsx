// /*
// import { nanoid } from '@/lib/utils'
// import { Chat } from '@/components/chat'
// import { AI } from '@/lib/chat/actions'
// import { auth } from '@/auth'
// import { Session } from '@/lib/types'
// import { getMissingKeys } from '@/app/actions'

// export const metadata = {
//   title: 'Reeply AI Chatbot'
// }

// export default async function IndexPage() {
//   const id = nanoid()
//   const session = (await auth()) as Session
//   const missingKeys = await getMissingKeys()

//   return (
//     <AI initialAIState={{ chatId: id, messages: [] }}>
//       <Chat id={id} session={session} missingKeys={missingKeys} />
//     </AI>
//   )
// }
// */
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/AIManager'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys, getUserDetail } from '@/app/actions'
import { redirect } from 'next/navigation'
import { useState } from 'react'

import { SidebarDesktop } from '@/components/sidebar-desktop'
import { Subscription } from '@/components/subscription/subscription'
import Stripe from 'stripe'
import { InvoiceItem } from '@/components/subscription/payment-history'
import CancelSubscriptionDialog from '@/components/CancelSubscriptionDialog'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export const metadata = {
  title: 'Reeply AI Chatbot'
}

const fetchInvoices = async (
  customerId: string | undefined
): Promise<InvoiceItem[]> => {
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

export default async function IndexPage() {
  const userDetail = await getUserDetail()
  const user = userDetail.user

  if (!user) {
    // if user is not found redirect to login page
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }

  const invoices = await fetchInvoices(user?.sub_stripe_customer_id)
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      <Subscription
        user={user}
        invoices={invoices}
        handleCancelSubscription={handleCancelSubscription}
      />
    </div>
  )
}