'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Info } from 'lucide-react'
import { AIMessageWithTyping } from '../ai-message-with-typing'

interface BudgetStepProps {
  budget: string
  setBudget: React.Dispatch<React.SetStateAction<string>>
  onNext: () => void
  onPrevious: () => void
  canProceed: boolean
  onValidationChange?: (isValid: boolean) => void
}

interface CurrencyBudgetData {
  name: string
  code: string
  min_daily_budget_without_offset_closest_int: number
  error: string | null
}

export function BudgetStep({
  budget,
  setBudget,
  onNext,
  onPrevious,
  canProceed,
  onValidationChange
}: BudgetStepProps) {
  const [currencyData, setCurrencyData] = useState<CurrencyBudgetData | null>(null)
  const [fetchError, setFetchError] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Fallback values
  const DEFAULT_CURRENCY = 'USD'
  const DEFAULT_MIN_BUDGET = 5

  useEffect(() => {
    const fetchCurrencyData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/fasty-bot/proxy-get-currency-and-min-budget')
        
        if (!response.ok) {
          throw new Error('Failed to fetch currency data')
        }
        
        const data = await response.json()
        setCurrencyData(data)
        setFetchError(false)
      } catch (err) {
        console.error('Error fetching currency data:', err)
        // Silent fallback to defaults - don't show error state
        setCurrencyData({
          name: 'US Dollar',
          code: DEFAULT_CURRENCY,
          min_daily_budget_without_offset_closest_int: DEFAULT_MIN_BUDGET,
          error: null
        })
        setFetchError(false) // Don't show error state, use fallback silently
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrencyData()
  }, [])

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBudget(value)
    }
  }

  const validateBudget = () => {
    if (!budget) return
    
    const budgetValue = parseFloat(budget)
    
    // If we have currency data, use it; otherwise use fallback values
    const minBudget = currencyData?.min_daily_budget_without_offset_closest_int || DEFAULT_MIN_BUDGET
    const currencyCode = currencyData?.code || DEFAULT_CURRENCY
    
    if (isNaN(budgetValue)) {
      setValidationError('Please enter a valid number')
    } else if (budgetValue < minBudget) {
      setValidationError(`The minimum budget allowed is ${minBudget} ${currencyCode}`)
    } else {
      setValidationError(null)
    }
  }

  useEffect(() => {
    validateBudget()
  }, [budget, currencyData])

  // Notify parent component about validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const budgetValue = parseFloat(budget)
      const minBudget = currencyData?.min_daily_budget_without_offset_closest_int || DEFAULT_MIN_BUDGET
      const isValid = budget.trim() !== '' && !isNaN(budgetValue) && budgetValue >= minBudget
      onValidationChange(isValid)
    }
  }, [budget, currencyData, validationError, onValidationChange])

  const getBudgetRecommendation = () => {
    const budgetNum = parseFloat(budget)
    if (isNaN(budgetNum)) return ''
    
    const minBudget = currencyData?.min_daily_budget_without_offset_closest_int || DEFAULT_MIN_BUDGET
    const currencyCode = currencyData?.code || DEFAULT_CURRENCY
    
    if (budgetNum < minBudget) {
      return `Consider a higher budget for better reach and results. Minimum: ${minBudget} ${currencyCode}`
    } else if (budgetNum >= minBudget && budgetNum <= 50) {
      return 'Good starting budget for testing your campaign.'
    } else if (budgetNum > 50 && budgetNum <= 100) {
      return 'Solid budget that should deliver good results.'
    } else {
      return 'Excellent budget for maximum reach and impact.'
    }
  }

  // Display the minimum budget or the fallback info
  const renderBudgetInfo = () => {
    if (isLoading) {
      return (
        <div className="text-xs text-gray-400 mb-3">
          Checking currency and minimum budget...
        </div>
      )
    }
    
    if (fetchError) {
      return (
        <div className="text-xs text-gray-400 mb-3">
          Could not fetch currency info. Using default minimum budget: {DEFAULT_MIN_BUDGET} {DEFAULT_CURRENCY}
        </div>
      )
    }
    
    if (currencyData) {
      return (
        <div className="text-xs text-gray-400 mb-3">
          Minimum budget: {currencyData.min_daily_budget_without_offset_closest_int} {currencyData.code}
        </div>
      )
    }
    
    return null
  }

  return (
    <>
      {/* AI Greeting Message with Typing Effect */}
      <AIMessageWithTyping message="Excellent! Last step - let's set your daily budget. This determines how much you'll spend per day on your campaign. You can always adjust this later!" />

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
              
              {/* Budget Input Field */}
              {renderBudgetInfo()}
              <div className="relative">
                <input
                  type="text"
                  value={budget}
                  onChange={handleBudgetChange}
                  placeholder={isLoading ? "Loading..." : "Enter daily budget"}
                  className={`w-full px-4 py-4 pr-20 bg-[#1A1D29] border ${validationError ? 'border-red-500' : 'border-[#2A2E3A]'} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4BF29C] focus:border-[#4BF29C] placeholder:text-gray-400 transition-all duration-200 text-base sm:text-lg font-medium`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  {isLoading ? 'Checking Currency...' : (currencyData?.code || DEFAULT_CURRENCY)}
                </div>
              </div>
              
              {validationError && (
                <div className="text-red-500 text-sm mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">{validationError}</div>
              )}

              {/* Budget Recommendation */}
              {budget && !isNaN(parseFloat(budget)) && !validationError && (
                <div className="mt-3 p-3 sm:p-4 bg-[#1A1D29] rounded-lg border border-[#2A2E3A]">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-[#4BF29C] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base text-white font-medium">Budget Analysis</p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">{getBudgetRecommendation()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs sm:text-sm text-gray-400 space-y-1">
                <p>• Minimum budget: {currencyData?.min_daily_budget_without_offset_closest_int || DEFAULT_MIN_BUDGET} {currencyData?.code || DEFAULT_CURRENCY}</p>
                <p>• You can pause or adjust your budget anytime</p>
                <p>• Facebook will try to spend your full daily budget for optimal results</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <button
                onClick={onPrevious}
                className="flex items-center justify-center px-6 py-3 text-gray-300 hover:text-white border border-[#2A2E3A] hover:border-gray-500 rounded-lg font-medium transition-all duration-200 text-base active:scale-[0.98]"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </button>
              <button
                onClick={onNext}
                disabled={!canProceed}
                className={`px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 ${
                  canProceed
                    ? 'bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90 transform hover:scale-[1.02] active:scale-[0.98]'
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