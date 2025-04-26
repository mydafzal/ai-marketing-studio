import { subscriptionUpdated, subscriptionCreated, subscriptionCanceled } from "@/app/paddle";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		// Read and parse the request body
		const response = await req.json();
		console.log(response)

		// console.log("Received Paddle webhook:", data);
		if (response.event_type === "subscription.updated") {
			console.log(`Subscription ${response.data.id} renewed.`);
			await subscriptionUpdated(response.data);
		}
		else if (response.event_type === "subscription.created") {
			console.log(`Subscription ${response.data.id} created.`);
			await subscriptionCreated(response.data);
		}
		else if (response.event_type === "subscription.canceled") {
			console.log(`Subscription ${response.data.id} cancelled.`);
			await subscriptionCanceled(response.data);
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
