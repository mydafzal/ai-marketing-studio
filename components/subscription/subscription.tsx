'use client'
import { useState } from 'react'

import { MonthlyPricing } from '@/components/subscription/monthly-pricing'
import { YearlyPricing } from '@/components/subscription/yearly-pricing'

import { Card } from '@/components/subscription/card'

import { InvoiceItem, PaymentHistory } from './payment-history'
import { User } from '@/lib/types'
import CancelSubscriptionDialog from '../CancelSubscriptionDialog'
import { useRouter } from 'next/navigation'

export interface SubscriptionProps {
  user: User
  invoices: InvoiceItem[]
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
  invoices,
  handleCancelSubscription
}: SubscriptionProps) {
  const router = useRouter()
  const durationIsMonthly = !user.sub_interval || user.sub_interval === 'month'
  const [isMonthly, setIsMonthly] = useState(durationIsMonthly)

  let currentPlanTag = getCurrentPlanTag(user)

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
          <div className="text-center">
            <h1 className="text-[40px] font-bold text-purple-600">
              Subscription Plans
            </h1>
            <p className="my-4 text-gray-600 text-[16px] leading-[22.89px]">
              Select from one of our plans that suit you, your project goals and
              team
            </p>
          </div>

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

          {/* show pricing database dependent on isMonthly */}

          {isMonthly ? (
            <MonthlyPricing currentPlanTag={currentPlanTag} />
          ) : (
            <YearlyPricing currentPlanTag={currentPlanTag} />
          )}

          <Card user={user} onCancelSubscription={showModal} />
          <PaymentHistory invoices={invoices} />
        </div>
      </div>
      {/* Modal dialog */}
      <CancelSubscriptionDialog
        open={openModal}
        handleModalCancel={handleModalCancel}
        handleModalOk={handleModalOk}
      />
    </>
  )
}
