'use client'
import { useState, useEffect } from 'react'
import { MonthlyPricing } from '@/components/subscription/monthly-pricing'
import { YearlyPricing } from '@/components/subscription/yearly-pricing'
import { Card } from '@/components/subscription/card'
import { InvoiceItem, PaymentHistory } from './payment-history'
import { User } from '@/lib/types'
import CancelSubscriptionDialog from '../CancelSubscriptionDialog'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUser } from '@/app/login/actions'

export interface SubscriptionProps {
  user: User
  handleCancelSubscription: () => void
}

const getCurrentPlanTag = (user: User) => {
  if (user.sub_interval && user.sub_offer) {
    return `${user.sub_interval}_${user.sub_offer}`
  } else {
    return 'none'
  }
}

export function Subscription({
  user,
  handleCancelSubscription
}: SubscriptionProps) {

  const [invoices, setInvoices] = useState<InvoiceItem[]>([])

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.sub_stripe_customer_id) return
  
      const res = await fetch('/api/stripe/invoices', {
        method: 'POST',
        body: JSON.stringify({ customerId: user.sub_stripe_customer_id }),
        headers: { 'Content-Type': 'application/json' }
      })
  
      const data = await res.json()
      if (res.ok && data.invoices) {
        setInvoices(data.invoices)
      }
    }
  
    fetchInvoices()
  }, [user.sub_stripe_customer_id])

  const formattedInvoices = invoices.map((invoice) => ({
    ...invoice,
    date: new Date(invoice.date), // Convert string to Date object
  }))
  
  const router = useRouter()
  const [isMonthly, setIsMonthly] = useState(!user.sub_interval || user.sub_interval === 'month')
  const [openModal, setOpenModal] = useState(false)

  function showModal() {
    if (user.sub_offer) {
      setOpenModal(true)
    }
  }

  function handleModalCancel() {
    setOpenModal(false)
  }

  function handleModalOk() {
    handleCancelSubscription()
    setOpenModal(false)
    router.refresh() // Refresh the page
  }

  return (
    <>
      <div className="group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative overflow-auto">
        <div className="max-w-5xl mx-auto py-12">

            {!user.sub_status ||  user.sub_status !== 'active' && (
            <div className="text-center">
              <h1 className="text-[40px] font-bold text-purple-600">
                Subscription Plans
              </h1>
              <p className="my-4 text-gray-600 text-[16px] leading-[22.89px]">
                Select from one of our plans that suit you, your project goals and
                team
              </p>
          </div>
              )}

          {user.sub_status === 'active' && (
              <div className="text-center">
                <h1 className="text-[40px] font-bold text-purple-600">
                  Manage Subscription
                </h1>
                <p className="my-4 text-gray-600 text-[16px] leading-[22.89px]">
                  Your current Reeply AI subscription plan can be seen below.
                </p>
              </div>
          )}



              {/* If subscription is active, only show Plan Details */}
          {user.sub_status === 'active' ? (
            <Card user={user} onCancelSubscription={showModal} />
          ) : (
            <>
              <div className="flex items-center justify-center">
                <div className="flex bg-purple-100 rounded-lg p-1">
                  <button
                    onClick={() => setIsMonthly(true)}
                    className={`px-6 py-2 text-sm font-medium rounded-lg ${
                      isMonthly ? 'bg-purple-600 text-white' : 'text-black'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsMonthly(false)}
                    className={`px-6 py-2 text-sm font-medium rounded-lg ${
                      !isMonthly ? 'bg-purple-600 text-white' : 'text-black'
                    }`}
                  >
                    Annually
                  </button>
                </div>
              </div>

              {isMonthly ? (
                <MonthlyPricing currentPlanTag={getCurrentPlanTag(user)} />
              ) : (
                <YearlyPricing currentPlanTag={getCurrentPlanTag(user)} />
              )}
            </>
          )}
          {user.sub_status && (
            <PaymentHistory invoices={formattedInvoices} />
          )}
        </div>
      </div>
    </>
  )
}
