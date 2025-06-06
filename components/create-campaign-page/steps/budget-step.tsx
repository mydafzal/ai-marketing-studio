'use client'

import React, { useState } from 'react'
import { ArrowLeft, Info, DollarSign, Euro, PoundSterling } from 'lucide-react'

interface BudgetStepProps {
  budget: string
  setBudget: React.Dispatch<React.SetStateAction<string>>
  onNext: () => void
  onPrevious: () => void
  canProceed: boolean
}

export function BudgetStep({
  budget,
  setBudget,
  onNext,
  onPrevious,
  canProceed
}: BudgetStepProps) {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD')

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£'
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBudget(value)
    }
  }

  const formatBudget = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    
    // Format with 2 decimal places if needed
    return num % 1 === 0 ? num.toString() : num.toFixed(2)
  }

  const getBudgetRecommendation = () => {
    const budgetNum = parseFloat(budget)
    if (isNaN(budgetNum)) return ''
    
    if (budgetNum < 10) {
      return 'Consider a higher budget for better reach and results.'
    } else if (budgetNum >= 10 && budgetNum <= 50) {
      return 'Good starting budget for testing your campaign.'
    } else if (budgetNum > 50 && budgetNum <= 100) {
      return 'Solid budget that should deliver good results.'
    } else {
      return 'Excellent budget for maximum reach and impact.'
    }
  }

  return (
    <>
      {/* AI Greeting Message - Better Centered */}
      <div className="w-full flex justify-center px-2 sm:px-0">
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
                Excellent! Last step - let&apos;s set your daily budget. This determines how much you&apos;ll spend per day on your campaign. You can always adjust this later!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section - Better Centered */}
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-4 sm:p-6 shadow-lg border border-[#1A1D29]/50">
            
            {/* Budget Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white flex items-center">
                  Daily Budget
                  <Info size={16} className="ml-2 text-gray-400" />
                </label>
              </div>
              
              {/* Currency Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-400">Currency:</span>
                <div className="flex gap-2">
                  {(['USD', 'EUR', 'GBP'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                        currency === curr
                          ? 'bg-[#4BF29C] text-black'
                          : 'bg-[#1A1D29] text-gray-300 hover:bg-[#2A2E3A] border border-[#2A2E3A]'
                      }`}
                    >
                      {curr === 'USD' && <DollarSign size={14} />}
                      {curr === 'EUR' && <Euro size={14} />}
                      {curr === 'GBP' && <PoundSterling size={14} />}
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Input Field */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                  {currencySymbols[currency]}
                </div>
                <input
                  type="text"
                  value={budget}
                  onChange={handleBudgetChange}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-[#1A1D29] border border-[#2A2E3A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4BF29C] focus:border-[#4BF29C] placeholder:text-gray-400 transition-all duration-200 text-lg font-medium"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  per day
                </div>
              </div>

              {/* Budget Recommendation */}
              {budget && !isNaN(parseFloat(budget)) && (
                <div className="mt-3 p-3 bg-[#1A1D29] rounded-lg border border-[#2A2E3A]">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-[#4BF29C] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Budget Analysis</p>
                      <p className="text-xs text-gray-400 mt-1">{getBudgetRecommendation()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400">
                <p>• Minimum recommended daily budget: {currencySymbols[currency]}10</p>
                <p>• You can pause or adjust your budget anytime</p>
                <p>• Facebook will try to spend your full daily budget for optimal results</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={onPrevious}
                className="flex items-center px-6 py-3 text-gray-300 hover:text-white border border-[#2A2E3A] hover:border-gray-500 rounded-lg font-medium transition-all duration-200"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </button>
              <button
                onClick={onNext}
                disabled={!canProceed}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  canProceed
                    ? 'bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90 transform hover:scale-[1.02]'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                Review Campaign
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 