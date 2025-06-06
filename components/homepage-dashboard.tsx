'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { Session } from '@/lib/types'
import { getUserDetail } from '@/app/actions'
import { nanoid } from '@/lib/utils'

interface HomepageDashboardProps {
  session: Session
}

interface ActionItem {
  title: string
  description: string
  href: string
  icon: string
}

export function HomepageDashboard({ session }: HomepageDashboardProps) {
  const router = useRouter()
  const [userDetails, setUserDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [aiGreeting, setAiGreeting] = useState<string>('')
  const [greetingLoading, setGreetingLoading] = useState(true)

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const result = await getUserDetail()
        if (result.success && result.user) {
          setUserDetails(result.user)
        }
      } catch (error) {
        console.error('Error fetching user details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserDetails()
  }, [])

  useEffect(() => {
    const fetchAiGreeting = async () => {
      try {
        // Get user context for the AI greeting
        const firstName = userDetails?.first_name || 
          (session?.user?.email ? session.user.email.split('@')[0].split('.')[0] : 'there')
        
        const response = await fetch('/api/generate-ai-greeting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
            timeOfDay: new Date().getHours(),
            userDetails: userDetails
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setAiGreeting(data.greeting)
        } else {
          // Fallback to static greeting
          setAiGreeting(getStaticGreeting())
        }
      } catch (error) {
        console.error('Error fetching AI greeting:', error)
        // Fallback to static greeting
        setAiGreeting(getStaticGreeting())
      } finally {
        setGreetingLoading(false)
      }
    }

    if (!isLoading && userDetails) {
      fetchAiGreeting()
    } else if (!isLoading) {
      // If no user details, just use static greeting
      setAiGreeting(getStaticGreeting())
      setGreetingLoading(false)
    }
  }, [isLoading, userDetails, session])

  const getStaticGreeting = () => {
    // Fallback static greeting logic
    let firstName = userDetails?.first_name
    
    if (!firstName && session?.user?.email) {
      firstName = session.user.email.split('@')[0].split('.')[0]
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
    }
    
    firstName = firstName || 'there'
    
    const hour = new Date().getHours()
    
    if (hour < 12) {
      return `Good morning, ${firstName}! Welcome back!`
    } else if (hour < 17) {
      return `Good afternoon, ${firstName}! Ready to create some amazing campaigns?`
    } else {
      return `Good evening, ${firstName}! Let's make your marketing shine!`
    }
  }

  const actionItems: ActionItem[] = [
    {
      title: "Create a new campaign",
      description: "Launch a new marketing campaign with AI-powered targeting and optimization",
      href: "/create-campaign",
      icon: "🚀"
    },
    {
      title: "Create ad creatives", 
      description: "Generate compelling ad visuals and copy using our AI creative tools",
      href: "/ai-creative-studio",
      icon: "🎨"
    },
    {
      title: "Check campaign results",
      description: "View performance metrics and insights for your active campaigns",
      href: "/marketing-insights",
      icon: "📊"
    }
  ]

  const handleActionClick = (href: string) => {
    router.push(href)
  }

  const handleRecommendationsClick = () => {
    // Create a new chat ID and redirect with a pre-filled message
    const chatId = nanoid()
    router.push(`/chat/${chatId}`)
    
    // Use setTimeout to ensure the page has loaded before sending the message
    setTimeout(() => {
      const message = "Show me recommendations for my campaigns. I'd like to optimize my current marketing performance and get insights on what I should focus on next."
      
      // Dispatch a custom event that the chat component can listen to
      window.dispatchEvent(new CustomEvent('send-initial-message', {
        detail: { message }
      }))
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4BF29C]"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center px-3 sm:px-6">
      <div className="w-full max-w-4xl space-y-6 sm:space-y-8 py-4 sm:py-0">
        {/* AI Greeting Message - Centered */}
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
          <div className="flex justify-center">
            <div className="flex items-start max-w-xl w-full">
              <div className="mr-3 sm:mr-4 flex-shrink-0">
                {/* Enhanced Color Blob - Responsive Size */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(75,242,156,0.7)] sm:shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                    style={{
                      animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                      backgroundSize: "300% 300%"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                      animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                      backgroundSize: "400% 400%",
                      animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                      backgroundSize: "200% 200%",
                      animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-[2px] rounded-full"
                    style={{
                      background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                      animation: "pulse 2s ease-in-out infinite alternate"
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
                <div className="text-white text-sm sm:text-base typing-container">
                  {greetingLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4BF29C]"></div>
                      <span className="text-gray-400">Generating personalized greeting...</span>
                    </div>
                  ) : (
                    aiGreeting
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items - Responsive Grid */}
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
          <h3 className="text-white text-lg sm:text-xl font-medium px-2 mb-4 sm:mb-6 text-center">What would you like to do today?</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2">
            {actionItems.map((item, index) => (
              <div 
                key={index}
                className="action-card bg-[#151925] p-4 sm:p-5 rounded-lg shadow-lg border border-[#1A1D29]/50 cursor-pointer min-h-[100px] sm:min-h-[120px] active:scale-95 transition-all"
                onClick={() => handleActionClick(item.href)}
              >
                <div className="flex items-start gap-3 sm:gap-4 h-full">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-1 leading-tight">{item.title}</h4>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                  </div>
                  <div className="text-[#4BF29C] opacity-60 flex-shrink-0">
                    <svg width="16" height="16" className="sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
          <div 
            className="recommendations-card p-4 sm:p-5 rounded-lg cursor-pointer min-h-[80px] sm:min-h-[100px] active:scale-95 transition-all"
            onClick={handleRecommendationsClick}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-xl sm:text-2xl flex-shrink-0">🎯</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm sm:text-base mb-1 leading-tight">My recommendations for your campaigns</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">Get AI-powered insights and suggestions to optimize your marketing performance</p>
              </div>
              <div className="text-[#4BF29C] flex-shrink-0">
                <svg width="16" height="16" className="sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats or Additional Info */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
          <div className="text-center text-gray-500 text-xs sm:text-sm leading-relaxed">
            Need help getting started? Just ask me anything about creating campaigns, generating ads, or analyzing your results!
          </div>
        </div>
      </div>
    </div>
  )
} 