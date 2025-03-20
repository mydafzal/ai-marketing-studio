'use client'
import { useState } from 'react'

export interface YearlyPricingProps {
  currentPlanTag: string
}

const yearlyBasicPlanLookupKey =
  process.env.NEXT_PUBLIC_STRIPE_YEARLY_CONTENT_PLAN_LOOKUP_KEY || ''
const yearlyProPlanLookupKey =
  process.env.NEXT_PUBLIC_STRIPE_YEARLY_MARKETING_PLAN_LOOKUP_KEY || ''
// Create a reusable BadgeIcon component
const BadgeIcon = () => (
  <span className="text-purple-600 mr-2 flex items-center justify-center">
    <img src="/badge-check.png" alt="checked" />
  </span>
)

export function YearlyPricing({ currentPlanTag }: YearlyPricingProps) {
  return (
    <div className="mt-10  p-6">
      <p className="text-black-600 font-medium flex items-center justify-center text-center">
        <img src="info.png" alt="info" className="mr-2" />
        You’re currently on a free trial
      </p>
      <p className="mt-2 text-gray-600 text-center">
        Subscribe to any of our plans for continued access to Reeply AI once
        trial period is exceeded.
      </p>

      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-center">
            <button className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium flex items-center">
              <img src="diamond1.png" alt="info" className="mr-2" />
              Save up to 70% with the Annual Subscriptions Package
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {/* AI Content Creator Plan */}
            <div className="border-2 border-purple-600 rounded-lg p-6 flex flex-col relative">
              <div className="flex items-center mb-4">
                <div className="flex justify-between items-center w-full">
                  <div className="bg-purple-100 text-purple-600 rounded-full p-2">
                    <img src="/basic.png" alt="basic" />
                  </div>
                  {currentPlanTag === 'year_basic' && (
                    <div className="bg-purple-600 text-white px-4 py-1 text-xs font-medium rounded-full">
                      Current Plan
                    </div>
                  )}
                </div>
              </div>
              <h3 className="ml-2 mb-4 font-bold text-purple-600 text-[18px]">
                AI Content Creator
              </h3>

              <p className="text-4xl font-bold">€25</p>
              <p className="text-gray-500 text-sm">/ Month (Billed annually)</p>
              <hr className="my-4" />
              <p className="font-medium mb-4">Plan Features:</p>
              <ul className="text-sm space-y-2 grow">
                <li className="flex items-center">
                  <BadgeIcon />
                  100 Image downloads monthly
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  20 Video downloads monthly
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Multiple aspect ratios (1:1, 9:16, 4:3, etc.)
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Image editing with AI brushing
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Generate 5-10 second video scenes
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Product angle shots
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Ad creative generation
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Priority support
                </li>
              </ul>

              {currentPlanTag === 'year_basic' ? (
                <button className="mt-6 w-full bg-purple-100 text-purple-600 py-2 rounded-lg font-medium">
                  Current Plan
                </button>
              ) : (
                <form action="/api/stripe/create-checkout-session" method="POST">
                  <input type="hidden" name="lookup_key" value={yearlyBasicPlanLookupKey} />
                  <button className="mt-6 w-full bg-purple-100 text-purple-600 py-2 rounded-lg font-medium" type="submit">
                    Get Started
                  </button>
                </form>
              )}
            </div>

            {/* AI Marketer Suite Plan */}
            <div className="border-2 border-gray-200 rounded-lg p-6 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="flex justify-between items-center w-full">
                  <div className="bg-purple-100 text-purple-600 rounded-full p-2">
                    <img src="/pro.png" alt="basic" />
                  </div>
                  {currentPlanTag === 'year_pro' && (
                    <div className="bg-purple-600 text-white px-4 py-1 text-xs font-medium rounded-full">
                      Current Plan
                    </div>
                  )}
                </div>
              </div>
              <h3 className="ml-2 mb-4 font-bold text-purple-600 text-[18px]">
                AI Marketer Suite
              </h3>
              <p className="text-4xl font-bold">€90</p>
              <p className="text-gray-500 text-sm">/ Month (Billed annually)</p>
              <hr className="my-4" />
              <p className="font-medium mb-4">
                Includes everything in the AI Content Creator Plan, plus:
              </p>
              <ul className="text-sm space-y-2 grow">
                <li className="flex items-center">
                  <BadgeIcon />
                  Unlimited image downloads
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Unlimited video downloads
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  All AI Content Creator features
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Meta Ad Campaign analysis
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  AI campaign recommendations
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Automatic budget adjustments
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Target audience optimization
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Campaign creation from scratch
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Placement optimization
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Conversational campaign management
                </li>
              </ul>

              {currentPlanTag === 'year_pro' ? (
                <button className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg font-medium">
                  Current Plan
                </button>
              ) : (
                <form action="/api/stripe/create-checkout-session" method="POST">
                  <input type="hidden" name="lookup_key" value={yearlyProPlanLookupKey} />
                  <button className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg font-medium" type="submit">
                    Start Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
