import { useState, useEffect } from 'react'
import { getFreePlanLimits } from '@/app/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  usageType?: 'messages' | 'images' | 'videos' | 'inpainting'
  currentCount?: number
}

export function UpgradeModal({
  isOpen,
  onClose,
  usageType = 'messages',
  currentCount = 0
}: UpgradeModalProps) {
  const router = useRouter()

  // State to store limits
  const [limits, setLimits] = useState({
    MAX_MESSAGES: 5,
    MAX_IMAGES: 5,
    MAX_VIDEOS: 1,
    MAX_INPAINTING: 1
  })
  
  // Get limits from server
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const freeLimits = await getFreePlanLimits()
        setLimits(freeLimits)
      } catch (error) {
        console.error('Error fetching limits:', error)
      }
    }
    
    fetchLimits()
  }, [])
  
  // Get the limit based on usage type
  const getLimit = () => {
    switch (usageType) {
      case 'messages':
        return limits.MAX_MESSAGES
      case 'images':
        return limits.MAX_IMAGES
      case 'videos':
        return limits.MAX_VIDEOS
      case 'inpainting':
        return limits.MAX_INPAINTING
      default:
        return 0
    }
  }

  // Get feature name for display
  const getFeatureName = () => {
    switch (usageType) {
      case 'messages':
        return 'AI chat messages'
      case 'images':
        return 'AI-generated images'
      case 'videos':
        return 'AI-generated videos'
      case 'inpainting':
        return 'image inpainting sessions'
      default:
        return 'feature uses'
    }
  }

  const handleUpgrade = () => {
    router.push('/subscription')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="pt-2 text-base text-gray-700">
            You've used {currentCount} out of {getLimit()} free {getFeatureName()}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-base font-medium">
            Upgrade to continue creating campaigns, chatting with AI, and generating ads.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="mr-2 text-[#4BF29C]">✓</span>
              <span>Unlimited AI chat messages</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-[#4BF29C]">✓</span>
              <span>Unlimited image generation</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-[#4BF29C]">✓</span>
              <span>Unlimited video generation</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-[#4BF29C]">✓</span>
              <span>Advanced social media campaign tools</span>
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleUpgrade} 
            className="w-full bg-[#4BF29C] text-[#0A0C14] hover:bg-[#3AD88C] font-medium"
          >
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}