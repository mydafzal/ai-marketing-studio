import { subscriptionUpdated, subscriptionCreated, subscriptionCanceled } from "@/app/paddle";
import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/utils";

export async function POST(req: NextRequest) {
	try {
		// Read and parse the request body
		const response = await req.json();
		console.log(response)

		// console.log("Received Paddle webhook:", data);
		if (response.event_type === "subscription.updated") {
			console.log(`Subscription ${response.data.id} renewed.`);
			await subscriptionUpdated(response.data);
			await trackEvent('Subscription Updated', 
				{ email: response.data.customer.email, id: response.data.customer.id },
				{ 
					subscription_id: response.data.id,
					plan_id: response.data.items[0].price_id,
					status: response.data.status
				}
			);
		}
		else if (response.event_type === "subscription.created") {
			console.log(`Subscription ${response.data.id} created.`);
			await subscriptionCreated(response.data);
			await trackEvent('Subscription Created', 
				{ email: response.data.customer.email, id: response.data.customer.id },
				{ 
					subscription_id: response.data.id,
					plan_id: response.data.items[0].price_id,
					status: response.data.status
				}
			);
		}
		else if (response.event_type === "subscription.canceled") {
			console.log(`Subscription ${response.data.id} cancelled.`);
			await subscriptionCanceled(response.data);
			await trackEvent('Subscription Canceled', 
				{ email: response.data.customer.email, id: response.data.customer.id },
				{ 
					subscription_id: response.data.id,
					plan_id: response.data.items[0].price_id,
					status: response.data.status
				}
			);
		}
		return NextResponse.json({ success: true, message: "Webhook received" });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json(
			{ success: false, message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
