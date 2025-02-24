"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cancelUserSubscription } from "@/app/actions"
import { format } from "date-fns";

type PlansProps = {
    fetchUser: any;
    userDetails: any;
}

export default function PlanSubscribed({
    fetchUser,
    userDetails
}: PlansProps) {
    console.log(userDetails)
    const [subscription, setSubscription] = useState({
        plan: "Transcription Pro",
        price: 100,
        status: "Active",
        startDate: "2023-07-28",
        nextPayment: "2024-07-21",
        paymentMethod: "Visa **** 5678",
        pastPayments: [
            { date: userDetails.user.subscriptionDate, amount: userDetails.user.subscriptionAmount, status: "Paid" },
        ],
        products: [{ name: "Transcription Pro", qty: 1, tax: 20, amount: 80 }],
    });
    return (
        <>
            <div className="flex flex-col w-full p-5">

                <h1 className="text-2xl text font-semibold">{subscription.plan}</h1>
                <div className="flex justify-between">
                    <div className="flex flex-col">
                        <p className="text-lg text-green-400">${userDetails.user.subscriptionAmount}/month</p>
                        <p className="text-sm">
                            Started on: {userDetails.user.subscriptionDate
                                ? format(new Date(userDetails.user.subscriptionDate), "MMMM d, yyyy")
                                : "N/A"}
                        </p>                    </div>
                    <Button
                        className="mt-4 bg-black"
                        onClick={async () => {
                            const response = await cancelUserSubscription();
                            if (response.success) {
                                alert("Subscription cancelled successfully");
                                fetchUser();
                            } else {
                                alert(response.error);
                            }
                        }}
                    >
                        Cancel Subscription
                    </Button>
                </div>
                <hr className="mt-3" />

                <div className="flex gap-5">
                    <div className="flex flex-col">
                        <Card className="p-4 mt-4 rounded-lg">
                            <h2 className="text-xl font-semibold">Next payment</h2>
                            <p>${subscription.price.toFixed(2)} {subscription.nextPayment}</p>
                            <p className="text-gray-400">Payment method: {subscription.paymentMethod}</p>
                            <Button className="mt-2 bg-black">Manage</Button>
                        </Card>
                        <Card className="p-4 mt-4 rounded-lg">
                            <h2 className="text-xl font-semibold">Payments</h2>
                            {subscription.pastPayments.map((payment, index) => (
                                <div key={index} className="flex justify-between text-sm py-2 border-b border-gray-700">
                                    <span>{format(new Date(payment.date), "MMMM d, yyyy")}</span>
                                    <span>${payment.amount.toFixed(2)}</span>
                                    <span className={payment.status === "Paid" ? "text-green-400" : "text-red-400"}>{payment.status}</span>
                                </div>
                            ))}
                        </Card>
                    </div>
                    <div className="flex-1">
                        <Card className="p-4 mt-4 rounded-lg">
                            <h2 className="text-xl font-semibold">Recurring Products</h2>
                            {subscription.products.map((product, index) => (
                                <div key={index} className="flex justify-between text-sm py-2">
                                    <span>{product.name}</span>
                                    <span>{product.qty}x</span>
                                    <span>Tax: {product.tax}%</span>
                                    <span>${product.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between text-lg font-semibold">
                                <span>Total</span>
                                <span>${subscription.price.toFixed(2)}</span>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    )
}