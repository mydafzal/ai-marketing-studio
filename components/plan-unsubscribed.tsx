"use client";

import { updateUserSubscription } from "@/app/actions";
import { useEffect } from "react";
import { Card } from "./ui/card";

type PlansProps = {
    fetchUser: any;
};

export default function PlanUnsubscribed({ fetchUser }: PlansProps) {
    const plans = [
        { title: "Standard", price: "10", priceId: "pri_01jkjmmbf9wxcp89ezf6wm27th" },
        { title: "Monthly", price: "10", priceId: "pri_01jkjmmbf9wxcp89ezf6wm27th" },
        { title: "Annually", price: "10", priceId: "pri_01jkjmmbf9wxcp89ezf6wm27th" }
    ];

    const handlePayment = (priceId: string, amount: any) => {
        if (typeof window !== "undefined" && window.Paddle) {
            window.Paddle.Checkout.open({
                items: [{ priceId, quantity: 1 }],
                customer: { email: "hassanamir210@gmail.com" }
            });
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!window.Paddle) {
                const script = document.createElement("script");
                script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
                script.async = true;
                script.onload = () => {
                    window.Paddle?.Environment.set(process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox");
                    window.Paddle?.Initialize({
                        token: process.env.NEXT_PUBLIC_PADDLE_TOKEN || "",
                        eventCallback: savePayment
                    });
                };
                document.body.appendChild(script);
            } else {
                window.Paddle.Environment.set(process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox");
                window.Paddle.Initialize({
                    token: process.env.NEXT_PUBLIC_PADDLE_TOKEN || "",
                    eventCallback: savePayment
                });
            }
        }
    }, []);

    const savePayment = async (event: any) => {
        console.log("Completed Event:", event);

        if (event.name === "checkout.completed") {
            const subscriptionId = event.data.id; // Paddle Order ID
            const amount = event.data.recurring_totals.total;

            try {
                const response = await updateUserSubscription(subscriptionId, amount);
                if (response.success) {
                    alert("Subscribed successfully");
                    fetchUser();
                } else {
                    alert(response.error);
                }
            } catch (error) {
                console.error("Error updating subscription:", error);
            }
        }
    };

    return (
        <div className="px-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plans.map((plan, index) => (
                <Card key={index} className="p-4 mt-4 rounded-lg flex flex-col items-center text-center">
                    <h2 className="text-2xl font-semibold text-gray-800">{plan.title}</h2>
                    <p className="text-lg text-gray-500 mt-2">${plan.price}</p>
                    <button
                        onClick={() => handlePayment(plan.priceId, plan.price)}
                        className="mt-4 w-full bg-black hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-all duration-300"
                    >
                        Subscribe Now
                    </button>
                </Card>
            ))}
        </div>
    );
}
