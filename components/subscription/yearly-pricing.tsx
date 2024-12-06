/* eslint-disable @next/next/no-img-element */

'use client'
import  { useState } from "react";


// Create a reusable BadgeIcon component
const BadgeIcon = () => (
    <span className="text-purple-600 mr-2 flex items-center justify-center">
        <img src="/badge-check.png" alt="checked" />
    </span>
);

export function YearlyPricing() {

    return (
        <div className="mt-10  p-6">
        <p className="text-black-600 font-medium flex items-center justify-center text-center">
          <img src="info.png" alt="info" className="mr-2" />
          You’re currently on a free trial
        </p>
        <p className="mt-2 text-gray-600 text-center">Subscribe to any of our plans for continued access to Reeply AI once trial period is exceeded.</p>

        <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-center">
            <button className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium flex items-center">
                <img src="diamond1.png" alt="info" className="mr-2" />
                Save 10% with the Annual Subscriptions Package
            </button>
        </div>


  
          {/* Cards */}
           {/* Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {/* Basic Plan */}
            <div className="border-2 border-purple-600 rounded-lg p-6 flex flex-col relative">
              
              <div className="flex items-center mb-4">
                  <div className="flex justify-between items-center w-full">
                    {/* Icon on the left */}
                    <div className="bg-purple-100 text-purple-600 rounded-full p-2">
                        <img src="/basic.png" alt="basic" />
                    </div>
                    
                    {/* Text on the right */}
                    <div className="bg-purple-600 text-white px-4 py-1 text-xs font-medium rounded-full">
                        Current Plan
                    </div>
                </div>
               
              </div>
              <h3 className="ml-2 mb-4 font-bold text-purple-600 text-[18px]">Basic</h3>

              <p className="text-4xl font-bold">€1,069</p>
              <p className="text-gray-500 text-sm">/ Month</p>
              <hr className="my-4" />
              <p className="font-medium mb-4">Basic Plan Supports:</p>
              <ul className="text-sm space-y-2 grow">
                <li className="flex items-center">
                    <BadgeIcon />
                    Access to ad campaign management
                </li>

                <li className="flex items-center">
                    <BadgeIcon />
                    €600 monthly ad budget
                </li>
              </ul>
              <button className="mt-6 w-full bg-purple-100 text-purple-600 py-2 rounded-lg font-medium">
                Current Plan
              </button>
            </div>
  
            {/* Pro Plan */}
            <div className="border-2 border-gray-200 rounded-lg p-6 flex flex-col">
            <div className="flex items-center mb-4">
                  <div className="flex justify-between items-center w-full">
                    {/* Icon on the left */}
                    <div className="bg-purple-100 text-purple-600 rounded-full p-2">
                        <img src="/pro.png" alt="basic" />
                    </div>
                   
                </div>
               
              </div>
              <h3 className="ml-2 mb-4 font-bold text-purple-600 text-[18px]">Pro</h3>
              <p className="text-4xl font-bold">€3,299</p>
              <p className="text-gray-500 text-sm">/ Month</p>
              <hr className="my-4" />
              <p className="font-medium mb-4">Includes everything in the Basic Plan plus:</p>
              <ul className="text-sm space-y-2 grow">
                <li className="flex items-center">
                    <BadgeIcon />
                  Campaign management with up to €5,000 monthly ad budget
                </li>
                <li className="flex items-center">
                    <BadgeIcon />
                  Weekly calls with a Reeply AI performance manager
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Advanced AI analytics for campaigns
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Access to AI content generation
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Future access to UGC Video AI content
                </li>
              </ul>
              <button className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg font-medium">
                Buy Pro Plan
              </button>
            </div>
  
            {/* Agency Plan */}
            <div className="border-2 border-gray-200 rounded-lg p-6 flex flex-col">
            <div className="flex items-center mb-4">
                  <div className="flex justify-between items-center w-full">
                    {/* Icon on the left */}
                    <div className="bg-purple-100 text-purple-600 rounded-full p-2">
                        <img src="/agency.png" alt="basic" />
                    </div>
                   
                </div>
               
              </div>
              <h3 className="ml-2 mb-4 font-bold text-purple-600 text-[18px]">Agency</h3>
             
              <p className="text-4xl font-bold">€6,469</p>
              <p className="text-gray-500 text-sm">/ Month</p>
              <hr className="my-4" />
              <p className="font-medium mb-4">Includes all Pro Plan features, plus:</p>
              <ul className="text-sm space-y-2 flex-grow">
                <li className="flex items-center">
                  <BadgeIcon />
                  Unlimited ad campaigns
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Premium support
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  Early access to all new features
                </li>
                <li className="flex items-center">
                  <BadgeIcon />
                  White-labeled AI analytics reports
                </li>
              </ul>
              <button className="mt-6 w-full border-2 border-purple-600 text-purple-600 py-2 rounded-lg font-medium">
                Buy Agency Plan
              </button>
            </div>
          </div>
        </div>
      </div>

       
      </div>
    )
}