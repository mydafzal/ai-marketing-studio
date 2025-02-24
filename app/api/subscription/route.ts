import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		// Read and parse the request body
		const data = await req.json();

		console.log("Received Paddle webhook:", data);

		// Process the webhook data (store in DB, trigger actions, etc.)

		return NextResponse.json({ success: true, message: "Webhook received" });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json(
			{ success: false, message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
