'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Minus, Send, Maximize2, MessageSquare } from 'lucide-react'
import { Avatar } from '@radix-ui/react-avatar'

type Message = {
  id: number
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

// Create a context to expose the widget functions
export const ChatWidgetContext = React.createContext<{
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  minimizeChat: () => void;
}>({
  openChat: () => {},
  closeChat: () => {},
  minimizeChat: () => {},
});

export default function DashboardChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const chatRef = useRef<HTMLDivElement>(null)
  const chatContentRef = useRef<HTMLDivElement>(null)
  
  // Expose functions through context
  useEffect(() => {
    // Make the chat functions available globally
    (window as any).dashboardChat = {
      open: handleOpenWithMessage,
      close: () => setIsOpen(false),
      minimize: () => setIsMinimized(true)
    };
  }, []);

  // Handle opening the chat with a preset message
  const handleOpenWithMessage = (message: string) => {
    setIsOpen(true)
    setIsMinimized(false)
    setInputValue(message)
    
    // Focus the input after a short delay to ensure it's visible
    setTimeout(() => {
      const inputEl = document.getElementById('chat-input')
      if (inputEl) {
        inputEl.focus()
      }
    }, 100)
  }

  // Handle chat submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim()) return
    
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiResponse = ''
      
      if (inputValue.toLowerCase().includes('compare')) {
        aiResponse = "Based on your last 3 campaigns, Campaign C has the highest conversion rate at 3.2% and lowest CPA at $18.75. Campaign A has a decent CTR of 2.7% but higher CPA. Campaign B is underperforming with only 1.9% CTR and high CPA. I recommend redirecting budget from Campaign B to Campaign C for better overall performance."
      } else {
        aiResponse = "I can help analyze your campaigns, suggest optimizations, or compare performance metrics. What specific information would you like to know?"
      }
      
      const aiMessage: Message = {
        id: Date.now(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // Scroll to bottom
      if (chatContentRef.current) {
        chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
      }
    }, 1000)
  }

  // Handle dragging start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatRef.current && !isMinimized) {
      const chatRect = chatRef.current.getBoundingClientRect()
      
      setDragOffset({
        x: e.clientX - chatRect.left,
        y: e.clientY - chatRect.top
      })
      
      setDragging(true)
    }
  }

  // Handle dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (dragging && !isMinimized) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  // Handle dragging end
  const handleMouseUp = () => {
    setDragging(false)
  }

  // Set up and clean up event listeners
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, dragOffset])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
    }
  }, [messages])

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div className="inline-flex items-center mr-3 bg-[#1A1D29] px-3 py-2 rounded-lg shadow-md border border-[#2A2E3A] cursor-pointer hover:bg-[#2A2E3A] transition-colors" onClick={() => handleOpenWithMessage("Compare my last 3 campaigns")}>
          <MessageSquare className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-xs text-gray-400">Ask me questions... e.g. Compare my last 3 campaigns</span>
        </div>
      )}
      
      {/* Minimized Chat Widget */}
      {isOpen && isMinimized && (
        <div
          className="fixed flex items-center justify-between bg-blue-600 text-white px-4 py-2 rounded-t-lg shadow-lg border border-blue-700 cursor-pointer hover:bg-blue-700 transition-colors z-50"
          style={{ 
            bottom: 0, 
            right: 20,
            width: '200px'
          }}
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Chat Assistant</span>
          </div>
          <Badge className="bg-blue-500 text-white text-xs">{messages.length > 0 ? messages.length : ''}</Badge>
        </div>
      )}
      
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div
          ref={chatRef}
          className="fixed bg-[#1A1D29] rounded-lg shadow-xl border border-[#2A2E3A] z-50 w-80 md:w-96 flex flex-col"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            height: '400px',
            transform: position.x === 0 && position.y === 0 ? 'translate(-50%, -50%)' : 'none',
            ...(position.x === 0 && position.y === 0 ? { top: '50%', left: '50%' } : {})
          }}
        >
          {/* Chat Header */}
          <div 
            className="bg-[#0A0C14] p-3 rounded-t-lg flex justify-between items-center cursor-move border-b border-[#2A2E3A]"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-medium">Campaign Assistant</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0" 
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMinimized(true)
                }}
              >
                <Minus className="h-4 w-4 text-gray-400" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div 
            ref={chatContentRef}
            className="flex-grow p-3 overflow-y-auto space-y-3"
          >
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex items-start mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mr-2">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#2A2E3A] rounded-lg p-3 max-w-[85%]">
                  <p className="text-white text-sm">Hi! I'm your campaign assistant. I can help analyze performance, suggest optimizations, or compare your campaigns. What would you like to know?</p>
                </div>
              </div>
            )}
            
            {/* Message history */}
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex items-start ${message.sender === 'user' ? 'justify-end' : ''}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mr-2">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div 
                  className={`rounded-lg p-3 max-w-[85%] ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#2A2E3A] text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 ml-2">
                    <span className="text-white text-xs">You</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <form 
            onSubmit={handleSubmit} 
            className="p-3 border-t border-[#2A2E3A] flex items-center"
          >
            <input
              id="chat-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow bg-[#0A0C14] text-white text-sm border border-[#2A2E3A] rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 rounded-l-none rounded-r-lg px-3 py-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}