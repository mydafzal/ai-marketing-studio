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
    <div className="p-6 bg-[#0A0C14] flex justify-center items-center">
      <div className="w-full max-w-sm bg-[#1A1D29] shadow-md rounded-lg border border-[#2A2E3A]">
        <div className="rounded-t-lg bg-[#4BF29C] h-2"></div>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Plan Details
          </h2>
          <div>
            {user.sub_offer ? (
              <p className="text-sm text-[#ADB0B8]">
                <span className="font-semibold text-white">Current Plan:</span>{' '}
                {user.sub_offer!.charAt(0).toUpperCase() +
                  user.sub_offer!.slice(1)}
              </p>
            ) : (
              <p className="text-sm text-[#ADB0B8]">
                <span className="font-semibold text-white">Current Plan:</span>
                {' No Subscription Plan'}
              </p>
            )}

            {user.sub_current_period_end && (
              <p className="text-sm text-[#ADB0B8] mt-1">
                <span className="font-semibold text-white">Next billing period:</span>{' '}
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
          <div className="border-t border-[#2A2E3A] my-4"></div>
        <Button className="mt-3 font-medium rounded-lg bg-[#4BF29C] text-[#0A0C14] hover:bg-[#3AD88C] transition-colors" onClick={handleManageSubscription}>
				  Manage Subscription
        </Button>
        </div>
      </div>
    </div>
  )
}
