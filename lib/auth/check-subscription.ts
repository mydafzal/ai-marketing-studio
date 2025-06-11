'use server'

import { auth } from '@/auth'
import { subscriptionBypassList } from '@/app/subscription/subscription-bypass-list'
import { getUser } from '@/app/login/actions'

/**
 * Server-side function to check if a user has an active subscription or is in the bypass list
 * Returns true if the user can access subscription-only features, false otherwise
 */
export async function checkUserSubscription(): Promise<boolean> {
  const session = await auth()
  
  // If no session or no email, user is not authenticated
  if (!session?.user?.email) {
    return false
  }
  
  const email = session.user.email
  
  // Check if user is in the bypass list
  if (subscriptionBypassList.includes(email)) {
    return true
  }
  
  // Check if user has active subscription
  try {
    const user = await getUser(email)
    return user?.hasActiveSubscription || false
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return false
  }
}