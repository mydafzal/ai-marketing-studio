import React from 'react'
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from '@/components/ui/button'
import { useOnboarding, OnboardingProvider } from './OnboardingContext'
import { Loader2, AlertCircle } from 'lucide-react'
import { OnboardingProps, STEPS } from './types'
import StepContent from './StepContent'
import AIOnboardingView from './AIOnboardingView'

function OnboardingDialog() {
  const { 
    currentStep, 
    error,
    setError,
    isSaving,
    handleNextStep,
    handlePrevStep,
    handleSave,
    handleClose,
    open,
    setOpen,
    isAllFieldsFilled
  } = useOnboarding()

  // Check if the dialog can be closed
  const canClose = isAllFieldsFilled()

  // Handle close request
  const handleCloseRequest = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    
    if (canClose) {
      handleClose()
    } else {
      setError("Please complete all required fields before closing this dialog.")
    }
  }

  return (
    <Dialog.Root 
      open={open} 
      onOpenChange={(isOpen) => {
        // Only allow closing if all fields are filled or if opening
        if (isOpen || canClose) {
          setOpen(isOpen)
        } else {
          setError("Please complete all required fields before closing this dialog.")
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={(e) => { 
            e.preventDefault() 
            if (!isSaving) handleCloseRequest() 
          }}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          onEscapeKeyDown={(e) => {
            // Always prevent default escape key behavior and handle manually
            e.preventDefault()
            if (!isSaving) handleCloseRequest()
          }}
          onPointerDownOutside={(e) => {
            // Always prevent default pointer outside behavior and handle manually
            e.preventDefault()
            if (!isSaving) handleCloseRequest()
          }}
          onInteractOutside={(e) => {
            // Always prevent default interaction outside behavior and handle manually
            e.preventDefault()
            if (!isSaving) handleCloseRequest()
          }}
        >
          <div className="w-full h-full max-w-full max-h-full overflow-auto bg-[#0F1117] flex flex-col">
            {/* Saving overlay */}
            {isSaving && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0F1117]/80 backdrop-blur-sm">
                <Loader2 className="size-16 text-[#4BF29C] animate-spin mb-4" />
                <p className="text-white text-lg font-medium">Saving your profile...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your experience.</p>
              </div>
            )}
            
            {/* Dialog close button - only shown if all fields are filled */}
            <div className="absolute right-4 top-4 z-10">
              <button
                className={`size-8 inline-flex items-center justify-center rounded-full border 
                  ${canClose 
                    ? 'border-transparent hover:border-gray-700 hover:bg-[#151925] text-gray-400 hover:text-white' 
                    : 'border-transparent bg-gray-800 text-gray-600 cursor-not-allowed'} 
                  focus:outline-none transition`}
                aria-label="Close"
                onClick={handleCloseRequest}
                disabled={isSaving}
              >
                <Cross2Icon className="size-4" />
              </button>
            </div>
            
            {/* Onboarding content - full width when in AI mode */}
            <div className="flex-1 p-6 md:overflow-y-auto h-full w-full">
              {/* Error message - shown for both views */}
              {error && (
                <div className="bg-red-900/20 border border-red-900 rounded-lg p-3 mb-4 flex items-start gap-2.5 max-w-2xl mx-auto">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertCircle className="size-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto flex-shrink-0 mt-0.5 text-red-500 hover:text-red-400"
                  >
                    <Cross2Icon className="size-4" />
                  </button>
                </div>
              )}
              
              {/* Conditionally render either the AI conversation UI or the standard UI */}
              {!isAllFieldsFilled() ? (
                // AI Conversation UI for new users - full height and centered
                <div className="h-full flex flex-col items-center justify-start pt-4 w-full overflow-y-auto">
                  <AIOnboardingView />
                </div>
              ) : (
                // Standard UI for profile editing
                <div className="max-w-2xl mx-auto">
                  {/* Simple Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4BF29C] transition-all duration-300 ease-in-out" 
                        style={{ 
                          width: `${(currentStep / (STEPS.length - 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Step content */}
                  <div className="mb-6">
                    <StepContent step={currentStep} />
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-[#1A1D29]">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 0 || isSaving}
                      className="text-gray-300 border-gray-700 hover:text-white hover:bg-[#1A1D29] hover:border-gray-600"
                    >
                      Back
                    </Button>
                    
                    {currentStep < STEPS.length - 1 ? (
                      <Button
                        onClick={handleNextStep}
                        disabled={isSaving}
                        className="bg-[#4BF29C] text-[#0F1117] font-medium hover:bg-[#4BF29C]/90"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#4BF29C] text-[#0F1117] font-medium hover:bg-[#4BF29C]/90"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save & Complete"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Main wrapper component that provides context
export default function Onboarding(props: OnboardingProps) {
  return (
    <OnboardingProvider {...props}>
      <OnboardingDialog />
    </OnboardingProvider>
  )
}