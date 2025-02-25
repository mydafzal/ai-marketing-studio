"use client";

import { createPortalSession } from "@/app/paddle";
import { Button } from "@/components/ui/button";

type PlansProps = {
	userDetails: any;
};

export default function PlanSubscribed({ userDetails }: PlansProps) {
	console.log(userDetails)

	const handleManageSubscription = async () => {
		const customerId = userDetails.user.subscription_customer_id; // Ensure this ID exists in userDetails
		const session = await createPortalSession(customerId);
		console.log(session)
		if (session?.data.urls.general.overview) {
			window.location.href = session?.data.urls.general.overview; // Redirect user to manage subscription
		} else {
			alert("Failed to open subscription portal");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[200px] p-5">
			<h1 className="text-xl font-semibold">You are subscribed</h1>
			<Button className="mt-4 bg-black" onClick={handleManageSubscription}>
				Manage Subscription
			</Button>
		</div>
	);
}
