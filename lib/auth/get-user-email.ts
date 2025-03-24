'use server'

import { auth } from '@/auth'
import {subscriptionBypassList} from "@/app/subscription/subscription-bypass-list";

export async function getEmailAndBypassStatus() {
    const session = await auth()
    const userEmail = session?.user?.email

    const isBypassed = userEmail ? subscriptionBypassList.includes(userEmail) : false

    return {
        email: userEmail,
        isBypassed,
    }
}
