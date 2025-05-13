'use client'
import { useState, useEffect } from 'react'
import { MonthlyPricing } from '@/components/subscription/monthly-pricing'
import { Card } from '@/components/subscription/card'
import { InvoiceItem, PaymentHistory } from './payment-history'
import { User } from '@/lib/types'
import CancelSubscriptionDialog from '../CancelSubscriptionDialog'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUser } from '@/app/login/actions'
import stripePriceConfig from '@/lib/stripe-price-provider'


export interface SubscriptionProps {
  user: User
  invoices: InvoiceItem[]
  handleCancelSubscription: () => void
  checkoutCanceled?: boolean
}

const getCurrentPlanTag = (user: User) => {
  if (user.sub_interval && user.sub_offer) {
    return `${user.sub_interval}_${user.sub_offer}`
  } else {
    return 'none'
  }
}

export function Subscription({
  user: initialUser,
  invoices,
  handleCancelSubscription,
  checkoutCanceled = false
}: SubscriptionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(initialUser)
  // Removed yearly pricing option
  const [openModal, setOpenModal] = useState(false)
  const [previousStatus, setPreviousStatus] = useState(initialUser.sub_status)

  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const res = await getUser(user.email)
        const data = res as User

        if (data) {
          if (previousStatus !== data.sub_status) {
            window.location.reload()
          }

          setPreviousStatus(data.sub_status)
          setUser(prev => ({
            ...prev,
            sub_status: data.sub_status !== undefined ? data.sub_status : 'inactive'
          }))
        }
      } catch (error) {
        console.error('Error fetching updated subscription:', error)
      }
    }

    if (searchParams.get('success') === 'true') {
      const interval = setInterval(fetchUserSubscription, 4000) // Poll every 4 sec
      setTimeout(() => clearInterval(interval), 20000) // Stop polling after 20 sec
    } else {
      fetchUserSubscription()
    }
  }, [searchParams, previousStatus])

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
      <div className="group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative overflow-auto bg-[#0F1117] dark:bg-[#0F1117] text-white dark:text-white flex flex-col items-center">
        <div className="max-w-5xl mx-auto py-12">
          {!user.sub_status || (user.sub_status !== 'active' && user.sub_status !== 'trialing') ? (
            <div className="text-center">
              <h1 className="text-[40px] font-bold text-white dark:text-white">
                Power Your Marketing with AI for <span className="text-[#4BF29C] dark:text-[#4BF29C]">€{stripePriceConfig.monthly.pro.pricePerMonth}</span>/month
              </h1>
              <p className="mt-3 max-w-2xl mx-auto text-[#ADB0B8] dark:text-[#ADB0B8] text-lg">
                Start today with our monthly subscription. You can cancel anytime on a monthly basis.
              </p>
              {checkoutCanceled && (
                <div className="mt-4 p-3 bg-[#1A1D29] rounded-lg border border-[#2A2E3A] text-white">
                  Your checkout was canceled. You can try again when you&apos;re ready.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-[40px] font-bold text-white dark:text-white">
                Manage <span className="text-[#4BF29C] dark:text-[#4BF29C]">Subscription</span>
              </h1>
              <p className="my-4 text-[#ADB0B8] dark:text-[#ADB0B8] text-[16px] leading-[22.89px]">
                Your current Reeply AI subscription plan can be seen below.
              </p>
            </div>
          )}

          {/* If subscription is active, only show Plan Details */}
          {user.sub_status === 'active' || user.sub_status === 'trialing' ? (
            <div className="bg-[#1A1D29] dark:bg-[#1A1D29] rounded-xl overflow-hidden border border-[#2A2E3A] dark:border-[#2A2E3A]">
              <Card user={user} onCancelSubscription={showModal} />
            </div>
          ) : (
            <>
              {/* Only show pricing with back button to onboarding-complete for non-subscribed users */}
              <MonthlyPricing
                currentPlanTag={getCurrentPlanTag(user)}
                showBackButton={!user.sub_status || (user.sub_status !== 'active' && user.sub_status !== 'trialing')}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal dialog - unchanged */}
      <CancelSubscriptionDialog
        open={openModal}
        handleModalCancel={handleModalCancel}
        handleModalOk={handleModalOk}
      />
    </>
  )
}