"use client"
import { useEffect, useState } from "react"
import { getUserDetail } from "../actions"
import PlanSubscribed from "@/components/plan-subscribed";
import PlanUnsubscribed from "@/components/plan-unsubscribed";

const Subscription = () => {
    const [userDetails, setUserDetails] = useState<any>();

    const fetchUser = async () => {
        const response: any = await getUserDetail();
        if (response.success) {
            setUserDetails(response);
        } else {
            console.log(response.error);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <div>
            {
                !userDetails?.user?.isSubscribed ?
                    <PlanUnsubscribed fetchUser={fetchUser} />
                    :
                    <PlanSubscribed fetchUser={fetchUser} userDetails={userDetails} />
            }


        </div>
    )
}

export default Subscription
