"use client";

import { createPortalSession } from "@/app/paddle";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type PlansProps = {
	userDetails: any;
};

export default function PlanSubscribed({ userDetails }: PlansProps) {
	const handleManageSubscription = async () => {
		const customerId = userDetails.user.subscription_customer_id; // Ensure this ID exists in userDetails
		const session = await createPortalSession(customerId);
		if (session?.data.urls.general.overview) {
			window.location.href = session?.data.urls.general.overview; // Redirect user to manage subscription
		} else {
			alert("Failed to open subscription portal");
		}
	};

	// Function to format date using date-fns
	const formatDate = (dateString: string) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return format(date, "MMMM dd, yyyy"); // Example: "March 15, 2025"
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[200px] p-5">
			<h1 className="text-xl font-semibold">
				You are subscribed to {userDetails.user.subscription_package_name} package
			</h1>
			{userDetails.user.subscripition_next_billing_at && (
				<h1 className="text-lg font-normal">
					Next Billing Date: {formatDate(userDetails.user.subscripition_next_billing_at)}
				</h1>
			)}
			<Button className="mt-4 bg-black" onClick={handleManageSubscription}>
				Manage Subscription
			</Button>
		</div>
	);
}
