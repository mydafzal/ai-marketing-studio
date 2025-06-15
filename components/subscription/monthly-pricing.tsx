'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import stripePriceConfig, { getLookupKey } from '@/lib/stripe-price-provider'

export interface MonthlyPricingProps {
  currentPlanTag: string
  showBackButton?: boolean
  selectedDuration?: string
}

// Create a reusable BadgeIcon component
const BadgeIcon = () => (
  <span className="text-[#4BF29C] mr-2 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  </span>
)

// Content Creator Icon (Rocket)
const ContentCreatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4BF29C]">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
  </svg>
)

// Marketer Suite Icon (Crown)
const MarketerSuiteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4BF29C]">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
)

// Diamond Icon for the button
const DiamondIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4BF29C] mr-2">
    <path d="m16 6 4 6-8 10L4 12l4-6"></path>
    <path d="M12 22V8"></path>
    <path d="m8 6 4-4 4 4"></path>
    <path d="M2 12h20"></path>
  </svg>
)

// Back Arrow Icon
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
    <path d="M19 12H5"></path>
    <path d="M12 19l-7-7 7-7"></path>
  </svg>
)

export function MonthlyPricing({ currentPlanTag, showBackButton = true, selectedDuration = 'monthly' }: MonthlyPricingProps) {
  const router = useRouter()
  
  // Helper function to get the billing period display text
  const getBillingPeriodText = (duration: string) => {
    switch(duration) {
      case 'monthly': return 'per month';
      case '3-month': return 'per month, billed quarterly';
      case '6-month': return 'per month, billed semi-annually';
      case 'yearly': return 'per month, billed annually';
      default: return 'per month';
    }
  };
  
  // Get the selected pricing plans based on the duration
  const selectedPlans = stripePriceConfig[selectedDuration as keyof typeof stripePriceConfig];
  
  return (
    <div className="bg-[#0F1117] dark:bg-[#0F1117] py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        {showBackButton && (
          <div className="mb-6 flex justify-center">
            <Link 
              href="/onboarding-complete" 
              className="flex items-center justify-center text-[#ADB0B8] hover:text-[#4BF29C] transition-colors"
            >
              <BackArrowIcon />
              <span>Back to Video Guides</span>
            </Link>
          </div>
        )}
        
        {/* Plan Cards */}
        <div className="flex flex-col lg:flex-row justify-center gap-6 mt-6">
          {/* Basic Plan */}
          {selectedPlans && !selectedPlans.basic.hidden && (
            <div className="border border-[#2A2E3A] rounded-lg p-6 flex flex-col flex-grow bg-[#1A1D29] dark:bg-[#1A1D29] text-white dark:text-white shadow-md max-w-lg w-full">
              <div className="flex items-center mb-4">
                <div className="flex justify-between items-center w-full">
                  <div className="bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] rounded-full p-2 flex items-center justify-center">
                    <MarketerSuiteIcon />
                  </div>
                  {currentPlanTag === `${selectedDuration.replace('-', '')}_basic` && (
                    <div className="bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-4 py-1 text-xs font-medium rounded-full">
                      Current Plan
                    </div>
                  )}
                </div>
              </div>
              <h3 className="ml-2 mb-1 font-bold text-[#4BF29C] dark:text-[#4BF29C] text-[18px]">
                {selectedPlans.basic.name}
              </h3>
              <p className="ml-2 mb-4 font-bold text-white text-[16px]">
                {selectedPlans.basic.currency}{selectedPlans.basic.pricePerMonth} {getBillingPeriodText(selectedDuration)}
              </p>
              <div className="flex flex-col">
              </div>
              <hr className="my-4 border-[#2A2E3A] dark:border-[#2A2E3A]" />
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                  AI Marketer
                </div>
                <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                  AI Creatives Generator
                </div>
              </div>
              
              <ul className="text-sm space-y-2 grow text-[#ADB0B8] dark:text-[#ADB0B8] mb-4">
                {selectedPlans.basic.features.map((feature, index) => (
                  <li key={index} className="flex items-center"><BadgeIcon /> {feature}</li>
                ))}
              </ul>

              {currentPlanTag === `${selectedDuration.replace('-', '')}_basic` ? (
                <button className="mt-6 w-full bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] py-2 rounded-lg font-medium border border-[#2A2E3A] dark:border-[#2A2E3A]">
                  Current Plan
                </button>
              ) : (
                <form action="/api/stripe/create-checkout-session" method="POST">
                  <input type="hidden" name="lookup_key" value={getLookupKey(selectedPlans.basic)} />
                  <button className="mt-6 w-full bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] py-2 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors" type="submit">
                    Subscribe Now
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Standard Plan */}
          {selectedPlans && !selectedPlans.standard.hidden && (
            <div className="border-2 border-[#4BF29C] rounded-lg p-6 flex flex-col flex-grow bg-[#1A1D29] dark:bg-[#1A1D29] text-white dark:text-white shadow-md max-w-lg w-full relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#4BF29C] text-black px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <div className="flex items-center mb-4">
                <div className="flex justify-between items-center w-full">
                  <div className="bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] rounded-full p-2 flex items-center justify-center">
                    <MarketerSuiteIcon />
                  </div>
                  {currentPlanTag === `${selectedDuration.replace('-', '')}_standard` && (
                    <div className="bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-4 py-1 text-xs font-medium rounded-full">
                      Current Plan
                    </div>
                  )}
                </div>
              </div>
              <h3 className="ml-2 mb-1 font-bold text-[#4BF29C] dark:text-[#4BF29C] text-[18px]">
                {selectedPlans.standard.name}
              </h3>
              <p className="ml-2 mb-4 font-bold text-white text-[16px]">
                {selectedPlans.standard.currency}{selectedPlans.standard.pricePerMonth} {getBillingPeriodText(selectedDuration)}
              </p>
              <div className="flex flex-col">
              </div>
              <hr className="my-4 border-[#2A2E3A] dark:border-[#2A2E3A]" />
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                  Premium Support
                </div>
                <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                  Training Included
                </div>
              </div>
              
              <ul className="text-sm space-y-2 grow text-[#ADB0B8] dark:text-[#ADB0B8] mb-4">
                {selectedPlans.standard.features.map((feature, index) => (
                  <li key={index} className="flex items-center"><BadgeIcon /> {feature}</li>
                ))}
              </ul>

              {currentPlanTag === `${selectedDuration.replace('-', '')}_standard` ? (
                <button className="mt-6 w-full bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] py-2 rounded-lg font-medium border border-[#2A2E3A] dark:border-[#2A2E3A]">
                  Current Plan
                </button>
              ) : (
                <form action="/api/stripe/create-checkout-session" method="POST">
                  <input type="hidden" name="lookup_key" value={getLookupKey(selectedPlans.standard)} />
                  <button className="mt-6 w-full bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] py-2 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors" type="submit">
                    Subscribe Now
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Pro Plan */}
          {selectedPlans && !selectedPlans.pro.hidden && (
            <div className="border border-[#2A2E3A] rounded-lg p-6 flex flex-col flex-grow bg-[#1A1D29] dark:bg-[#1A1D29] text-white dark:text-white shadow-md max-w-lg w-full">
              <div className="flex items-center mb-4">
                <div className="flex justify-between items-center w-full">
                  <div className="bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] rounded-full p-2 flex items-center justify-center">
                    <MarketerSuiteIcon />
                  </div>
                  {currentPlanTag === `${selectedDuration.replace('-', '')}_pro` && (
                    <div className="bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-4 py-1 text-xs font-medium rounded-full">
                      Current Plan
                    </div>
                  )}
                </div>
              </div>
              <h3 className="ml-2 mb-1 font-bold text-[#4BF29C] dark:text-[#4BF29C] text-[18px]">
                {selectedPlans.pro.name}
              </h3>
              <p className="ml-2 mb-4 font-bold text-white text-[16px]">
                {selectedPlans.pro.currency}{selectedPlans.pro.pricePerMonth} {getBillingPeriodText(selectedDuration)}
              </p>
              <div className="flex flex-col">
              </div>
              <hr className="my-4 border-[#2A2E3A] dark:border-[#2A2E3A]" />
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                  Enterprise-grade
                </div>
                <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                  Dedicated Manager
                </div>
              </div>
              
              <ul className="text-sm space-y-2 grow text-[#ADB0B8] dark:text-[#ADB0B8] mb-4">
                {selectedPlans.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center"><BadgeIcon /> {feature}</li>
                ))}
              </ul>

              {currentPlanTag === `${selectedDuration.replace('-', '')}_pro` ? (
                <button className="mt-6 w-full bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] py-2 rounded-lg font-medium border border-[#2A2E3A] dark:border-[#2A2E3A]">
                  Current Plan
                </button>
              ) : (
                <form action="/api/stripe/create-checkout-session" method="POST">
                  <input type="hidden" name="lookup_key" value={getLookupKey(selectedPlans.pro)} />
                  <button className="mt-6 w-full bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] py-2 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors" type="submit">
                    Subscribe Now
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}