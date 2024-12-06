/* eslint-disable @next/next/no-img-element */
'use client'
import  { useState } from "react";


// Create a reusable BadgeIcon component
const BadgeIcon = () => (
    <span className="text-purple-600 mr-2 flex items-center justify-center">
        <img src="/badge-check.png" alt="checked" />
    </span>
);

const PlanPopup = ({ buttonText }: { buttonText: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openPopup = () => setIsOpen(true);
  const closePopup = () => setIsOpen(false);

  return (
    <div className="flex items-center justify-center bg-white-100">
      {/* Button to open popup */}
    
      <button onClick={openPopup} className="mt-6 w-full bg-purple-100 text-purple-600 py-2 rounded-lg font-medium">
        {buttonText}
      </button>

      {/* Popup Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>

            {/* Dialog Content */}
            <div className="text-center">
              {/* Header Icon */}
              <div className="mb-4">
                <span className="inline-block bg-purple-100 text-purple-600 rounded-full p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-3.313 0-6 2.239-6 5 0 2.761 2.687 5 6 5s6-2.239 6-5c0-2.761-2.687-5-6-5zm-8 5c0-5.523 4.477-10 10-10s10 4.477 10 10c0 5.523-4.477 10-10 10S4 18.523 4 13z"
                    />
                  </svg>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Confirm Pro Plan
              </h2>

              {/* Price */}
              <p className="text-lg font-semibold text-purple-600 mb-4">
                €299 / Month
              </p>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                Your new plan starts now. You’ll pay{" "}
                <strong>€299 monthly</strong> starting today, 11 December 2024.
              </p>
              <p className="text-sm text-gray-600">
                You agree that your subscription will continue and that we will
                charge the updated monthly fee until you cancel. You may cancel
                at any time to avoid future charges.
              </p>

              {/* Buttons */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={closePopup}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Confirmed!");
                    closePopup();
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export function MonthlyPricing() {

    return (
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

              <p className="text-4xl font-bold">€99</p>
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
          
              <PlanPopup buttonText="Buy Basic Plan"/>
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
              <p className="text-4xl font-bold">€299</p>
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
             
              <p className="text-4xl font-bold">€599</p>
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
    )
}