'use client'
import { User } from '@/lib/types'
import { Button } from '../ui/button'

/* eslint-disable @next/next/no-img-element */
export interface CardProps {
  user: User
  onCancelSubscription: () => void
}
export function Card({ user, onCancelSubscription }: CardProps) {

	const handleManageSubscription = async () => {
		try {
		  const response = await fetch("/api/stripe/create-portal", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ customer_id: user.sub_stripe_customer_id }),
		  });
	 
		  const data = await response.json();
		  console.log("data: ", data);
		  if (data.url) {
			window.location.href = data.url;
		  } else {
			alert("Failed to open Stripe Customer Portal.");
		  }
		} catch (error) {
		  console.error("Error opening Stripe portal:", error);
		  alert("Something went wrong.");
		}
	  };

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
        <Button className="mt-3 font-medium rounded-lg bg-purple-600 text-white" onClick={handleManageSubscription}>
				  Manage Subscription
        </Button>
        </div>
      </div>
    </div>
  )
}
