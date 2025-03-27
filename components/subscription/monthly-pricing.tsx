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
  <span className="text-green-500 mr-2 flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  </span>
)

// Content Creator Icon (Rocket)
const ContentCreatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
  </svg>
)

// Marketer Suite Icon (Crown)
const MarketerSuiteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
)

// Diamond Icon for the button
const DiamondIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2">
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
        {/* Header */}
        <div className="flex items-center justify-center">
          <button className="bg-[#1A1D29] dark:bg-[#1A1D29] text-green-500 dark:text-green-500 px-4 py-2 rounded-full font-medium flex items-center border border-gray-800 dark:border-gray-800">
            <DiamondIcon />
            Save up to 70% with the Annual Subscriptions Package
          </button>
        </div>

        {/* Cards with Improved Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {/* AI Content Creator Plan */}
          <div className="border-2 border-purple-600 dark:border-purple-600 rounded-lg p-6 flex flex-col relative flex-grow bg-[#1A1D29] dark:bg-[#1A1D29] text-white dark:text-white">
            <div className="flex items-center mb-4">
              <div className="flex justify-between items-center w-full">
                <div className="bg-[#2A2D39] dark:bg-[#2A2D39] text-purple-500 dark:text-purple-500 rounded-full p-2 flex items-center justify-center">
                  <ContentCreatorIcon />
                </div>
                {currentPlanTag === 'month_basic' && (
                  <div className="bg-purple-600 dark:bg-purple-600 text-white px-4 py-1 text-xs font-medium rounded-full">
                    Current Plan
                  </div>
                )}
              </div>
            </div>
            <h3 className="ml-2 mb-4 font-bold text-purple-500 dark:text-purple-500 text-[18px]">
              AI Content Creator
            </h3>

            <p className="text-4xl font-bold text-white dark:text-white">€45</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm">/ Month</p>
            <hr className="my-4 border-gray-800 dark:border-gray-800" />
            <p className="font-medium mb-4 text-white dark:text-white">Plan Features:</p>
            <ul className="text-sm space-y-2 grow text-gray-300 dark:text-gray-300">
              <li className="flex items-center"><BadgeIcon /> 100 Image downloads monthly</li>
              <li className="flex items-center"><BadgeIcon /> 20 Video downloads monthly</li>
              <li className="flex items-center"><BadgeIcon /> Multiple aspect ratios (1:1, 9:16, 4:3, etc.)</li>
              <li className="flex items-center"><BadgeIcon /> Image editing with AI brushing</li>
              <li className="flex items-center"><BadgeIcon /> Generate 5-10 second video scenes</li>
              <li className="flex items-center"><BadgeIcon /> Product angle shots</li>
              <li className="flex items-center"><BadgeIcon /> Ad creative generation</li>
              <li className="flex items-center"><BadgeIcon /> Priority support</li>
            </ul>

            {currentPlanTag === 'month_basic' ? (
              <button className="mt-6 w-full bg-[#2A2D39] dark:bg-[#2A2D39] text-purple-500 dark:text-purple-500 py-2 rounded-lg font-medium border border-purple-500 dark:border-purple-500">
                Current Plan
              </button>
            ) : (
              <form action="/api/stripe/create-checkout-session" method="POST">
                <input type="hidden" name="lookup_key" value={monthlyBasicPlanLookupKey} />
                <button className="mt-6 w-full bg-[#2A2D39] dark:bg-[#2A2D39] text-purple-500 dark:text-purple-500 py-2 rounded-lg font-medium border border-purple-500 dark:border-purple-500" type="submit">
                  Get Started
                </button>
              </form>
            )}
          </div>

          {/* AI Marketer Suite Plan */}
          <div className="border-2 border-purple-600 dark:border-purple-600 rounded-lg p-6 flex flex-col flex-grow bg-[#1A1D29] dark:bg-[#1A1D29] text-white dark:text-white">
            <div className="flex items-center mb-4">
              <div className="flex justify-between items-center w-full">
                <div className="bg-[#2A2D39] dark:bg-[#2A2D39] text-purple-500 dark:text-purple-500 rounded-full p-2 flex items-center justify-center">
                  <MarketerSuiteIcon />
                </div>
                {currentPlanTag === 'month_pro' && (
                  <div className="bg-purple-600 dark:bg-purple-600 text-white px-4 py-1 text-xs font-medium rounded-full">
                    Current Plan
                  </div>
                )}
              </div>
            </div>
            <h3 className="ml-2 mb-4 font-bold text-purple-500 dark:text-purple-500 text-[18px]">
              AI Marketer Suite
            </h3>
            <p className="text-4xl font-bold text-white dark:text-white">€297</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm">/ Month</p>
            <hr className="my-4 border-gray-800 dark:border-gray-800" />
            <p className="font-medium mb-4 text-white dark:text-white">Includes everything in the AI Content Creator Plan, plus:</p>
            <ul className="text-sm space-y-2 grow text-gray-300 dark:text-gray-300">
              <li className="flex items-center"><BadgeIcon /> Unlimited image downloads</li>
              <li className="flex items-center"><BadgeIcon /> Unlimited video downloads</li>
              <li className="flex items-center"><BadgeIcon /> All AI Content Creator features</li>
              <li className="flex items-center"><BadgeIcon /> Meta Ad Campaign analysis</li>
              <li className="flex items-center"><BadgeIcon /> AI campaign recommendations</li>
              <li className="flex items-center"><BadgeIcon /> Automatic budget adjustments</li>
              <li className="flex items-center"><BadgeIcon /> Target audience optimization</li>
              <li className="flex items-center"><BadgeIcon /> Campaign creation from scratch</li>
              <li className="flex items-center"><BadgeIcon /> Placement optimization</li>
              <li className="flex items-center"><BadgeIcon /> Conversational campaign management</li>
            </ul>

            {currentPlanTag === 'month_pro' ? (
              <button className="mt-6 w-full bg-purple-600 dark:bg-purple-600 text-white py-2 rounded-lg font-medium">
                Current Plan
              </button>
            ) : (
              <form action="/api/stripe/create-checkout-session" method="POST">
                <input type="hidden" name="lookup_key" value={monthlyProPlanLookupKey} />
                <button className="mt-6 w-full bg-purple-600 dark:bg-purple-600 text-white py-2 rounded-lg font-medium" type="submit">
                  Start Now
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}