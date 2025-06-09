'use client'

import React, { useState, useEffect } from 'react'

interface AIMessageWithTypingProps {
  message: string
  className?: string
}

export function AIMessageWithTyping({ message, className = '' }: AIMessageWithTypingProps) {
  const [displayedMessage, setDisplayedMessage] = useState<string>('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (message) {
      setIsTyping(true)
      setDisplayedMessage('')
      
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex < message.length) {
          setDisplayedMessage(message.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(typingInterval)
          setIsTyping(false)
        }
      }, 30) // Adjust speed here (lower = faster)

      return () => clearInterval(typingInterval)
    }
  }, [message])

  return (
    <div className={`w-full flex justify-center px-2 sm:px-0 ${className}`}>
      <div className="w-full max-w-xl">
        <div className="flex items-start">
          <div className="mr-3 sm:mr-4 flex-shrink-0">
            {/* Enhanced Color Blob */}
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
              {displayedMessage}
              {isTyping && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 