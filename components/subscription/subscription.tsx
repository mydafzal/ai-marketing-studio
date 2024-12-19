'use client'
import { useState } from 'react'

import { MonthlyPricing } from '@/components/subscription/monthly-pricing'
import { YearlyPricing } from '@/components/subscription/yearly-pricing'

import { Card } from '@/components/subscription/card'

import { InvoiceItem, PaymentHistory } from './payment-history'
import { User } from '@/lib/types'

export interface SubscriptionProps {
  user: User
  invoices: InvoiceItem[]
}

export function Subscription({ user, invoices }: SubscriptionProps) {
  const [isMonthly, setIsMonthly] = useState(true)

  return (
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

        {isMonthly ? <MonthlyPricing /> : <YearlyPricing />}

        <Card />
        <PaymentHistory invoices={invoices} />
      </div>
    </div>
  )
}
