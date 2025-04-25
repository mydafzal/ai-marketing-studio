'use client'
import { useState } from 'react'

export interface MonthlyPricingProps {
  currentPlanTag: string
}

const monthlyBasicPlanLookupKey =
  process.env.NEXT_PUBLIC_STRIPE_MONTHLY_CONTENT_PLAN_LOOKUP_KEY || ''
const monthlyProPlanLookupKey =
  process.env.NEXT_PUBLIC_STRIPE_MONTHLY_MARKETING_PLAN_LOOKUP_KEY || ''

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

export function MonthlyPricing({ currentPlanTag }: MonthlyPricingProps) {
  return (
    <div className="bg-[#0F1117] dark:bg-[#0F1117] py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header - removed the annual discount message */}

        {/* Single Card */}
        <div className="flex justify-center mt-6">
          {/* AI Marketer Suite Plan */}
          <div className="border-2 border-[#4BF29C] rounded-lg p-6 flex flex-col flex-grow bg-[#1A1D29] dark:bg-[#1A1D29] text-white dark:text-white shadow-md max-w-lg w-full">
            <div className="flex items-center mb-4">
              <div className="flex justify-between items-center w-full">
                <div className="bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] rounded-full p-2 flex items-center justify-center">
                  <MarketerSuiteIcon />
                </div>
                {currentPlanTag === 'month_pro' && (
                  <div className="bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] px-4 py-1 text-xs font-medium rounded-full">
                    Current Plan
                  </div>
                )}
              </div>
            </div>
            <h3 className="ml-2 mb-4 font-bold text-[#4BF29C] dark:text-[#4BF29C] text-[18px]">
              AI Marketer Suite
            </h3>
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
              <div className="bg-[#151925] px-4 py-2 rounded-full text-[#4BF29C] text-sm border border-[#2A2E3A]">
                Automatic Access to Updates
              </div>
            </div>
            
            <ul className="text-sm space-y-2 grow text-[#ADB0B8] dark:text-[#ADB0B8] mb-4">
              <li className="flex items-center"><BadgeIcon /> Campaign creation from scratch</li>
              <li className="flex items-center"><BadgeIcon /> Conversational campaign management</li>
              <li className="flex items-center"><BadgeIcon /> Meta Ad Campaign analysis</li>
              <li className="flex items-center"><BadgeIcon /> AI campaign recommendations</li>
              <li className="flex items-center"><BadgeIcon /> Ad creative generation</li>
              <li className="flex items-center"><BadgeIcon /> Image editing with AI brushing</li>
              <li className="flex items-center"><BadgeIcon /> Generate 5-10 second video scenes</li>
              <li className="flex items-center"><BadgeIcon /> Product angle shots</li>
            </ul>

            {currentPlanTag === 'month_pro' ? (
              <button className="mt-6 w-full bg-[#151925] dark:bg-[#151925] text-[#4BF29C] dark:text-[#4BF29C] py-2 rounded-lg font-medium border border-[#2A2E3A] dark:border-[#2A2E3A]">
                Current Plan
              </button>
            ) : (
              <form action="/api/stripe/create-checkout-session" method="POST">
                <input type="hidden" name="lookup_key" value={monthlyProPlanLookupKey} />
                <button className="mt-6 w-full bg-[#4BF29C] dark:bg-[#4BF29C] text-[#0A0C14] py-2 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors" type="submit">
                  Start Free 7-Day Trial
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}