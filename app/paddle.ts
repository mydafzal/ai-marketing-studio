'use server'

import { kv } from '@vercel/kv'

import { auth } from '@/auth'
export async function subscribeCustomer(customer_id: string) {
	const session = await auth();

	// Check if the user is authenticated
	if (!session || !session.user) {
		return { error: "User not authenticated" };
	}

	const userEmail = session.user.email; // Get the logged-in user's email
	if (!userEmail) {
		return { error: "User email not found" };
	}

	try {
		const userKey = `user:${userEmail}`;

		// Update subscription fields in Redis
		await kv.hset(userKey, {
			subscription_status: "Active",
			subscription_customer_id: customer_id,
		});

		return { success: true, message: "Subscription updated successfully" };
	} catch (error) {
		console.error(`Error updating subscription for user:${userEmail}`, error);
		return { error: "Failed to update subscription" };
	}
}

export async function createPortalSession(customerId: string) {
	try {

		const response = await fetch(`https://${process.env.NEXT_PUBLIC_PADDLE_URL}.paddle.com/customers/${customerId}/portal-sessions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				"Authorization": `Bearer ${process.env.NEXT_PUBLIC_PADDLE_API_KEY}`, // Replace with your Paddle API Key
			},
			body: JSON.stringify({}),
		})
		const data = await response.json();
		console.log(data)
		if (!response.ok) {
			throw new Error(data.error || "Failed to create portal session");
		}

		console.log("Portal Session Created:", data);
		return data;
	} catch (error) {
		console.error("Error creating portal session:", error);
	}
};

export async function subscriptionCanceled(data: any) {
	let email = data.custom_data.email;
	try {
		const userKey = `user:${email}`;

		// Remove subscription fields in Redis
		await kv.hset(userKey, {
			subscripition_id: data.id,
			subscripition_next_billing_at: data.next_billed_at,
			subscription_status: 'Canceled',
		});

		return { success: true, message: "Next billing date updated successfully" };
	} catch (error) {
		console.error(`Error updating subscription for customer: ${email}`, error);
		return { error: "Failed to update subscription" };
	}
}

export async function subscriptionCreated(data: any) {
	let email = data.custom_data.email;
	try {
		const userKey = `user:${email}`;

		// Remove subscription fields in Redis
		await kv.hset(userKey, {
			subscripition_id: data.id,
			subscripition_next_billing_at: data.next_billed_at,
		});

		return { success: true, message: "Next billing date updated successfully" };
	} catch (error) {
		console.error(`Error updating subscription for customer: ${email}`, error);
		return { error: "Failed to update subscription" };
	}
}

export async function subscriptionUpdated(data: any) {
	let email = data.custom_data.email;
	try {
		const userKey = `user:${email}`;

		// Remove subscription fields in Redis
		await kv.hset(userKey, {
			subscripition_next_billing_at: data.next_billed_at,
		});

		return { success: true, message: "Next billing date updated successfully" };
	} catch (error) {
		console.error(`Error updating subscription for customer: ${email}`, error);
		return { error: "Failed to update subscription" };
	}
}



export async function cancelUserSubscription() {
	const session = await auth();

	// Check if the user is authenticated
	if (!session || !session.user) {
		return { error: "User not authenticated" };
	}

	const userEmail = session.user.email; // Get the logged-in user's email
	if (!userEmail) {
		return { error: "User email not found" };
	}

	try {
		const userKey = `user:${userEmail}`;

		// Remove subscription fields in Redis
		await kv.hset(userKey, {
			isSubscribed: "false",
			subscriptionId: ""
		});

		return { success: true, message: "Subscription cancelled successfully" };
	} catch (error) {
		console.error(`Error cancelling subscription for user: ${userEmail}`, error);
		return { error: "Failed to cancel subscription" };
	}
}
