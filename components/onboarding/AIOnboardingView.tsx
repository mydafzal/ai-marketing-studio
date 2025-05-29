import React from 'react'
import { useOnboarding } from './OnboardingContext'
import { STEPS } from './types'
import StepContent from './StepContent'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * AI conversation style interface for new users during onboarding
 */
export default function AIOnboardingView() {
  const { 
    currentStep, 
    handleNextStep,
    handlePrevStep,
    handleSave,
    isSaving
  } = useOnboarding()

  // Get the AI message for the current step
  const getAIMessage = (stepId: string) => {
    switch(stepId) {
      case 'first_name':
        return "To personalize your experience, could you please tell me your first name?";
      case 'last_name':
        return "Great! Now, could you share your last name with me?";
      case 'company_name':
        return "What's the name of your company or business?";
      case 'website_analysis':
        return "I'd like to learn more about your business. What's your website address so I can analyze it for insights?";
      case 'company_type':
        return "What type of business are you running? This helps me tailor marketing strategies specifically for your industry.";
      case 'company_description':
        return "Could you describe what your business does and what makes it unique? This helps me create more targeted marketing content for you.";
      case 'privacy_policy':
        return "For compliance with advertising platforms, I'll need your privacy policy URL. This is required for running campaigns.";
      case 'preferred_language':
        return "What language would you like to use for your marketing campaigns?";
      case 'locations':
        return "Where would you like to target your advertising? Select the regions you want to focus on.";
      case 'confirm':
        return "Great! Here's a summary of the information you've provided. Please review it and click 'Save & Complete' when you're ready.";
      default:
        return "Please provide the required information to continue.";
    }
  };

  const currentStepId = STEPS[currentStep].id;
  const aiMessage = getAIMessage(currentStepId);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center h-full py-6 overflow-y-auto">
      {/* Simple Progress Bar */}
      <div className="mb-8 w-full max-w-xl">
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4BF29C] transition-all duration-300 ease-in-out" 
            style={{ 
              width: `${(currentStep / (STEPS.length - 1)) * 100}%` 
            }}
          />
        </div>
      </div>
      
      {/* Special layout for company description to ensure chat is visible */}
      {STEPS[currentStep].id === 'company_description' ? (
        <div className="w-full flex flex-col items-center space-y-8">
          {/* AI Message - Fixed at top */}
          <div className="w-full max-w-xl mb-4">
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0">
                {/* Enhanced Color Blob */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(75,242,156,0.7)]">
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
              <div className="bg-[#1A1D29] rounded-lg p-5 shadow flex-grow">
                <div className="text-white text-base typing-container relative" 
                   style={{ 
                     whiteSpace: "normal", 
                     minHeight: "24px",
                     wordBreak: "keep-all",
                     overflowWrap: "break-word",
                     hyphens: "none",
                     lineHeight: "1.5"
                   }}>
                  {/* Split by words to prevent word breaking */}
                  <span className="typing-text" key={`ai-message-${currentStepId}`}>
                    {aiMessage.split(/(\s+)/).map((word, wordIndex) => (
                      <span 
                        key={wordIndex} 
                        className="word-span"
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {word.split('').map((char, charIndex) => (
                          <span 
                            key={`${wordIndex}-${charIndex}`} 
                            style={{ 
                              '--index': wordIndex * 5 + charIndex,
                              display: 'inline'
                            } as React.CSSProperties}
                          >{char}</span>
                        ))}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Company description editor - Scrollable container */}
          <div className="w-full bg-[#151925] p-5 rounded-lg shadow-lg border border-[#1A1D29]/50 max-h-[50vh] overflow-visible">
            <StepContent step={currentStep} aiMode={true} />
          </div>
        </div>
      ) : (
        /* Standard layout for all other steps */
        <div className="mb-10 space-y-8 w-full max-w-xl">
          {/* AI Message with Animated Color Blob */}
          <div className="flex justify-center">
            <div className="flex items-start max-w-xl w-full">
              <div className="mr-4 flex-shrink-0">
                {/* Enhanced Color Blob */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(75,242,156,0.7)]">
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
              <div className="bg-[#1A1D29] rounded-lg p-5 shadow flex-grow">
                <div className="text-white text-base typing-container relative" 
                   style={{ 
                     whiteSpace: "normal", 
                     minHeight: "24px",
                     wordBreak: "keep-all",
                     overflowWrap: "break-word",
                     hyphens: "none",
                     lineHeight: "1.5"
                   }}>
                  {/* Split by words to prevent word breaking */}
                  <span className="typing-text" key={`ai-message-${currentStepId}`}>
                    {aiMessage.split(/(\s+)/).map((word, wordIndex) => (
                      <span 
                        key={wordIndex} 
                        className="word-span"
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {word.split('').map((char, charIndex) => (
                          <span 
                            key={`${wordIndex}-${charIndex}`} 
                            style={{ 
                              '--index': wordIndex * 5 + charIndex,
                              display: 'inline'
                            } as React.CSSProperties}
                          >{char}</span>
                        ))}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Input Area - Regular Steps */}
          <div className="flex justify-center items-center mt-6 mb-8 w-full">
            <div className="w-full max-w-xl bg-[#151925] p-5 rounded-lg shadow-lg border border-[#1A1D29]/50">
              <StepContent step={currentStep} aiMode={true} />
            </div>
          </div>
        </div>
      )}
      
      
      {/* Navigation buttons - always centered and fixed width */}
      <div className="flex justify-between items-center pt-4 border-t border-[#1A1D29] w-full max-w-xl mt-4">
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
  )
}