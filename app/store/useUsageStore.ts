import { create } from 'zustand'
import { 
  checkUsageLimit, 
  getFreePlanLimits,
  getSubscriptionInfo, 
  incrementUsageCounter 
} from '@/app/actions'

// Default limits until we fetch from server
const DEFAULT_LIMITS = {
  MAX_MESSAGES: 5,
  MAX_IMAGES: 5,
  MAX_VIDEOS: 1,
  MAX_INPAINTING: 1
}

interface UsageState {
  // Usage counts
  messageCount: number
  imageCount: number
  videoCount: number
  inpaintingCount: number
  
  // Limit statuses
  isMessageLimitReached: boolean
  isImageLimitReached: boolean
  isVideoLimitReached: boolean 
  isInpaintingLimitReached: boolean
  
  // Subscription status
  isSubscribed: boolean
  isLoading: boolean
  
  // Limits
  limits: typeof DEFAULT_LIMITS
  
  // Subscription setter
  setIsSubscribed: (status: boolean) => void
  
  // Actions
  fetchUsageData: () => Promise<void>
  incrementMessageCount: () => Promise<boolean>
  incrementImageCount: () => Promise<boolean>
  incrementVideoCount: () => Promise<boolean>
  incrementInpaintingCount: () => Promise<boolean>
  canSendMessage: () => boolean
  canGenerateImage: () => boolean
  canGenerateVideo: () => boolean
  canUseInpainting: () => boolean
}

export const useUsageStore = create<UsageState>((set, get) => ({
  // Initial state
  messageCount: 0,
  imageCount: 0,
  videoCount: 0,
  inpaintingCount: 0,
  
  isMessageLimitReached: false,
  isImageLimitReached: false,
  isVideoLimitReached: false,
  isInpaintingLimitReached: false,
  
  isSubscribed: false,
  isLoading: true,
  
  limits: DEFAULT_LIMITS,
  
  // Set subscription status
  setIsSubscribed: (status: boolean) => set({ isSubscribed: status }),
  
  // Fetch usage data from server
  fetchUsageData: async () => {
    try {
      set({ isLoading: true })
      
      // Get subscription info and limits in parallel
      const [data, limits] = await Promise.all([
        getSubscriptionInfo(),
        getFreePlanLimits()
      ])
      
      if (data && data.success) {
        const isSubscribed = data.sub_status === 'active' || data.sub_status === 'trialing'
        
        set({
          isSubscribed,
          messageCount: data.usageCounts?.messages || 0,
          imageCount: data.usageCounts?.images || 0,
          videoCount: data.usageCounts?.videos || 0,
          inpaintingCount: data.usageCounts?.inpainting || 0,
          limits,
          
          isMessageLimitReached: !isSubscribed && (data.usageCounts?.messages || 0) >= limits.MAX_MESSAGES,
          isImageLimitReached: !isSubscribed && (data.usageCounts?.images || 0) >= limits.MAX_IMAGES,
          isVideoLimitReached: !isSubscribed && (data.usageCounts?.videos || 0) >= limits.MAX_VIDEOS,
          isInpaintingLimitReached: !isSubscribed && (data.usageCounts?.inpainting || 0) >= limits.MAX_INPAINTING,
        })
      }
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  // Increment message count
  incrementMessageCount: async () => {
    try {
      const result = await incrementUsageCounter('messages')
      if (result.success) {
        set({ 
          messageCount: result.newCount || 0,
          isMessageLimitReached: result.limitReached || false
        })
        return !result.limitReached
      }
      return true
    } catch (error) {
      console.error('Error incrementing message count:', error)
      return false
    }
  },
  
  // Increment image count
  incrementImageCount: async () => {
    try {
      const result = await incrementUsageCounter('images')
      if (result.success) {
        set({ 
          imageCount: result.newCount || 0,
          isImageLimitReached: result.limitReached || false
        })
        return !result.limitReached
      }
      return true
    } catch (error) {
      console.error('Error incrementing image count:', error)
      return false
    }
  },
  
  // Increment video count
  incrementVideoCount: async () => {
    try {
      const result = await incrementUsageCounter('videos')
      if (result.success) {
        set({ 
          videoCount: result.newCount || 0,
          isVideoLimitReached: result.limitReached || false
        })
        return !result.limitReached
      }
      return true
    } catch (error) {
      console.error('Error incrementing video count:', error)
      return false
    }
  },
  
  // Increment inpainting count
  incrementInpaintingCount: async () => {
    try {
      const result = await incrementUsageCounter('inpainting')
      if (result.success) {
        set({ 
          inpaintingCount: result.newCount || 0,
          isInpaintingLimitReached: result.limitReached || false
        })
        return !result.limitReached
      }
      return true
    } catch (error) {
      console.error('Error incrementing inpainting count:', error)
      return false
    }
  },
  
  // Check if user can send messages
  canSendMessage: () => {
    const { isSubscribed, messageCount, limits } = get()
    return isSubscribed || messageCount < limits.MAX_MESSAGES
  },
  
  // Check if user can generate images
  canGenerateImage: () => {
    const { isSubscribed, imageCount, limits } = get()
    return isSubscribed || imageCount < limits.MAX_IMAGES
  },
  
  // Check if user can generate videos
  canGenerateVideo: () => {
    const { isSubscribed, videoCount, limits } = get()
    return isSubscribed || videoCount < limits.MAX_VIDEOS
  },
  
  // Check if user can use inpainting
  canUseInpainting: () => {
    const { isSubscribed, inpaintingCount, limits } = get()
    return isSubscribed || inpaintingCount < limits.MAX_INPAINTING
  }
}))