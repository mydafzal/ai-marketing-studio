'use client'
import { User } from '@/lib/types'

/* eslint-disable @next/next/no-img-element */
export interface CardProps {
  user: User
  onCancelSubscription: () => void
}
export function Card({ user, onCancelSubscription }: CardProps) {
  return (
    <div className="p-6 bg-gray-50 flex justify-start items-center">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg border border-gray-200">
        <div className="rounded-t-lg bg-purple-500 h-2"></div>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Plan Details
          </h2>
          <div>
            {user.sub_offer ? (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Current Plan:</span>{' '}
                {user.sub_offer!.charAt(0).toUpperCase() +
                  user.sub_offer!.slice(1)}
              </p>
            ) : (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Current Plan:</span>
                {' No Subscription Plan'}
              </p>
            )}

            {user.sub_current_period_end && (
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Next billing period:</span>{' '}
                {new Date(user.sub_current_period_end!).toLocaleDateString(
                  'en-GB',
                  {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }
                )}
              </p>
            )}
          </div>
          <div className="border-t border-gray-300 my-4"></div>
          {user.sub_offer && (
            <div className="flex items-center bg-purple-100 p-4 rounded-lg">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                alt="Visa Logo"
                className="w-12 h-auto mr-4"
              />
              <p className="text-gray-700 font-medium">**** **** **** 1267</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 ml-auto text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
        {user.sub_offer && (
          <button
            onClick={() => {
              onCancelSubscription()
            }}
            className="block w-full text-center text-red-600 font-semibold py-3 hover:bg-red-50"
          >
            Cancel Subscription?
          </button>
        )}
      </div>
    </div>
  )
}
