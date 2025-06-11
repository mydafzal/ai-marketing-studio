'use server'

import { auth } from '@/auth'
import { z } from 'zod'
import { createChatId } from '@/lib/chat/actions/Services/ChatObjectBuilder/ChatObjectBuilder'
import { revalidatePath } from 'next/cache'
import { subscriptionBypassList } from './subscription/subscription-bypass-list'
import { getUser } from './login/actions'

export async function createChat() {
  try {
    const chatId = await createChatId()
    return { id: chatId }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Check if a user has access to subscription-only features
 * Combines actual subscription status and bypass list check
 */
export async function checkSubscriptionAccess() {
  const session = await auth()
  if (!session?.user?.email) return { hasAccess: false }
  
  const userEmail = session.user.email
  
  // Check if user is in the bypass list
  if (subscriptionBypassList.includes(userEmail)) {
    return { hasAccess: true, bypassList: true }
  }
  
  // Check actual subscription status
  const user = await getUser(userEmail)
  const hasActiveSubscription = user?.hasActiveSubscription || false
  
  return { 
    hasAccess: hasActiveSubscription,
    subscriptionStatus: user?.subscriptionStatus
  }
}

/**
 * Get detailed information about the current user
 */
export async function getUserDetail() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return { success: false, error: 'User not authenticated' }
    }
    
    const userEmail = session.user.email
    const user = await getUser(userEmail)
    
    if (!user) {
      return { success: false, error: 'User details not found' }
    }
    
    return { 
      success: true, 
      user: {
        ...user,
        email: userEmail
      } 
    }
  } catch (error) {
    console.error('Error fetching user details:', error)
    return { success: false, error: (error as Error).message }
  }
}