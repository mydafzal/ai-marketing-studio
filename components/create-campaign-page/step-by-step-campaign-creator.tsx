'use client'

import React, { useState, useRef } from 'react'
import { MediaUploadStep } from './steps/media-upload-step'
import { UrlLinkStep } from './steps/url-link-step'  
import { BudgetStep } from './steps/budget-step'
import { useStepByCampaignMediaUpload } from './hooks/use-step-by-step-media-upload'
import { StepByStepMediaItem } from './types'

// Import ReviewStep with explicit path
import { ReviewStep } from '@/components/create-campaign-page/steps/review-step'

type Step = 'media' | 'url' | 'budget' | 'review'

export function StepByCampaignCreator() {
  const [currentStep, setCurrentStep] = useState<Step>('media')
  const [link, setLink] = useState('')
  const [budget, setBudget] = useState('')
  const [budgetIsValid, setBudgetIsValid] = useState(false)
  const [campaignObjective, setCampaignObjective] = useState('Lead Generation')
  const [selectedLeadFormId, setSelectedLeadFormId] = useState<string>("")
  const [selectedCustomerProfileId, setSelectedCustomerProfileId] = useState<string>("")
  
  // Use the media upload hook (copied from original)
  const { 
    mediaItems, 
    setMediaItems, 
    fileInputRef, 
    handleFileUpload, 
    removeMediaItem, 
    campaignSessionId,
    isUploading,
    cooldownActive,
    cooldownTimeRemaining
  } = useStepByCampaignMediaUpload()

  const handleNextStep = () => {
    switch (currentStep) {
      case 'media':
        if (mediaItems.length > 0) {
          setCurrentStep('url')
        }
        break
      case 'url':
        if (link.trim()) {
          setCurrentStep('budget')
        }
        break
      case 'budget':
        if (budget.trim()) {
          setCurrentStep('review')
        }
        break
    }
  }

  const handlePreviousStep = () => {
    switch (currentStep) {
      case 'url':
        setCurrentStep('media')
        break
      case 'budget':
        setCurrentStep('url')
        break
      case 'review':
        setCurrentStep('budget')
        break
    }
  }

  // Can proceed to next step validation
  const canProceed = () => {
    switch (currentStep) {
      case 'media':
        return mediaItems.length > 0 && mediaItems.some((item: StepByStepMediaItem) => item.progress === 100)
      case 'url':
        return link.trim() !== ''
      case 'budget':
        return budgetIsValid
      default:
        return false
    }
  }

  // Handle budget validation state changes
  const handleBudgetValidationChange = (isValid: boolean) => {
    setBudgetIsValid(isValid)
  }

  return (
    <div className="w-full max-w-3xl space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-6 py-2 sm:py-4">
        
        {currentStep === 'media' && (
          <MediaUploadStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            removeMediaItem={removeMediaItem}
            isUploading={isUploading}
            cooldownActive={cooldownActive}
            cooldownTimeRemaining={cooldownTimeRemaining}
            onNext={handleNextStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'url' && (
          <UrlLinkStep
            link={link}
            setLink={setLink}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'budget' && (
          <BudgetStep
            budget={budget}
            setBudget={setBudget}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            canProceed={canProceed()}
            onValidationChange={handleBudgetValidationChange}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            mediaItems={mediaItems}
            link={link}
            budget={budget}
            campaignObjective={campaignObjective}
            setCampaignObjective={setCampaignObjective}
            selectedLeadFormId={selectedLeadFormId}
            setSelectedLeadFormId={setSelectedLeadFormId}
            selectedCustomerProfileId={selectedCustomerProfileId}
            setSelectedCustomerProfileId={setSelectedCustomerProfileId}
            campaignSessionId={campaignSessionId}
            onPrevious={handlePreviousStep}
          />
        )}

    </div>
  )
} 