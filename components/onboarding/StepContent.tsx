import React from 'react'
import { STEPS, SEGMENT_OPTIONS } from './types'
import { useOnboarding } from './OnboardingContext'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Facebook
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import OnboardingLocationSelector from '../onboarding-location-selector'
import FacebookConnect from '@/components/facebook-connect'
import { MemoizedReactMarkdown } from '@/components/markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownEditor } from '@/components/markdown-editor'

export default function StepContent({ step, aiMode = false }: { step: number, aiMode?: boolean }) {
  const { 
    firstName, 
    setFirstName,
    lastName, 
    setLastName,
    companyName, 
    setCompanyName,
    companyDescription, 
    setCompanyDescription,
    websiteLink, 
    setWebsiteLink,
    privacyPolicyLink, 
    setPrivacyPolicyLink,
    preferredLanguage, 
    setPreferredLanguage,
    companySegment, 
    setCompanySegment,
    locations,
    setLocations,
    inputError,
    isAnalyzingWebsite,
    websiteAnalysisComplete,
    websiteData,
    foundPrivacyPolicy,
    getFieldError,
    userDetails,
    handleAnalyzeWebsite,
    isValidUrl
  } = useOnboarding()
  
  const currentStep = STEPS[step]

  // Helper function to render a text input field
  const renderTextField = (
    id: string,
    label: string,
    value: any,  // Accept any type
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    placeholder = "",
    type = "text"
  ) => {
    const error = getFieldError(id)
    // Convert value to string safely
    const stringValue = typeof value === 'string' ? value : 
                        value ? String(value) : '';
                        
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-white">
          {label}
        </Label>
        <Input
          id={id}
          type={type}
          value={stringValue}
          onChange={onChange}
          placeholder={placeholder}
          className={`bg-[#151925] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#4BF29C] focus:ring-[#4BF29C]/10 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`}
        />
        {error && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertCircle className="size-3.5 text-red-500" />
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // Helper function to render a textarea field
  const renderTextArea = (
    id: string,
    label: string,
    value: any,  // Accept any type
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
    placeholder = "",
    rows = 4
  ) => {
    const error = getFieldError(id)
    // Convert value to string safely
    const stringValue = typeof value === 'string' ? value : 
                        value ? String(value) : '';
    
    // Determine if this is the company description field to apply special styling
    const isCompanyDescription = id === 'company_description';
                        
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-white">
          {label}
        </Label>
        <Textarea
          id={id}
          value={stringValue}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`bg-[#151925] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#4BF29C] focus:ring-[#4BF29C]/10 
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${isCompanyDescription ? 'text-base leading-relaxed min-h-[300px] resize-y' : ''}`}
        />
        {error && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertCircle className="size-3.5 text-red-500" />
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // Helper function to render a step's content with or without header based on aiMode
  const renderStepWithOptionalHeader = (
    title: string, 
    description: string, 
    content: React.ReactNode
  ) => {
    if (aiMode) {
      // In AI mode, just render the content without headers
      return (
        <div className="space-y-4">
          {content}
        </div>
      );
    } else {
      // In standard mode, render with headers
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <p className="text-gray-400 text-sm">
              {description}
            </p>
          </div>
          <div className="space-y-4 pt-2">
            {content}
          </div>
        </div>
      );
    }
  };

  // Render content based on current step
  switch (currentStep.id) {
    case 'first_name':
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Tell us about yourself so we can personalize your experience.",
        renderTextField(
          'first_name',
          'First Name',
          firstName,
          (e) => setFirstName(e.target.value),
          'Enter your first name'
        )
      )
      
    case 'last_name':
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Tell us about yourself so we can personalize your experience.",
        renderTextField(
          'last_name',
          'Last Name',
          lastName,
          (e) => setLastName(e.target.value),
          'Enter your last name'
        )
      )
      
    case 'company_name':
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Tell us about yourself so we can personalize your experience.",
        renderTextField(
          'company_name',
          'Company Name',
          companyName,
          (e) => setCompanyName(e.target.value),
          'Enter your company name'
        )
      )
      
    case 'website_analysis':
      // For website analysis, we need to handle the content differently because of the conditionals
      const websiteContent = (
        <>
          <div className="space-y-4">
            {renderTextField(
              'website_link',
              'Website URL',
              websiteLink,
              (e) => setWebsiteLink(e.target.value),
              'https://example.com',
              'url'
            )}
            
            {/* Only show the analyze button when this is not the initial setup */}
            {userDetails?.defaultExtraDetails && !isAnalyzingWebsite && !websiteAnalysisComplete && (
              <button
                type="button"
                onClick={() => handleAnalyzeWebsite && handleAnalyzeWebsite()}
                className="px-4 py-2 bg-[#4BF29C] text-black rounded-md font-medium hover:bg-[#3bd283] transition-colors text-sm"
                disabled={!websiteLink || !isValidUrl(websiteLink)}
              >
                Analyze Website
              </button>
            )}
          </div>
          
          {/* Analysis status - show in both modes */}
          {isAnalyzingWebsite && (
            <div className="bg-[#1A1D29] rounded-lg p-4 mt-4 flex items-center gap-3">
              <Loader2 className="size-5 text-[#4BF29C] animate-spin" />
              <div>
                <p className="text-white font-medium">Analyzing website...</p>
                <p className="text-gray-400 text-sm">This may take a few moments</p>
              </div>
            </div>
          )}
          
          {websiteAnalysisComplete && websiteData && (
            <div className="bg-[#1A1D29] rounded-lg p-4 mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-[#4BF29C]" />
                <div>
                  <p className="text-white font-medium">Analysis complete!</p>
                  <p className="text-gray-400 text-sm">We&apos;ve extracted key information about your business</p>
                </div>
              </div>
              
              {websiteData.colors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300 font-medium">Brand Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {websiteData.colors.slice(0, 6).map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className="size-8 rounded-full border border-gray-700" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-gray-400 mt-1">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {websiteData.fonts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300 font-medium">Detected Fonts</p>
                  <div className="text-xs text-gray-400">
                    {websiteData.fonts.slice(0, 4).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      );
      
      return renderStepWithOptionalHeader(
        currentStep.group,
        userDetails?.defaultExtraDetails 
          ? "Update your website URL. Website analysis is optional for profile updates."
          : "Provide your website URL so our AI can analyze your business and customize your campaigns.",
        websiteContent
      )
      
    case 'company_type':
      const companyTypeContent = (
        <div className="space-y-2">
          <Label className="text-white">Company Size & Type</Label>
          <Select 
            value={companySegment} 
            onValueChange={setCompanySegment}
          >
            <SelectTrigger 
              className="bg-[#151925] border-gray-700 text-white focus:border-[#4BF29C] focus:ring-[#4BF29C]/10"
            >
              <SelectValue placeholder="Select company size & type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D29] border-gray-700">
              {Object.entries(SEGMENT_OPTIONS).map(([key, label]) => (
                <SelectItem 
                  key={key} 
                  value={key} 
                  className="text-white focus:bg-[#151925] focus:text-white data-[highlighted]:bg-[#151925]"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {inputError.company_segment && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="size-3.5 text-red-500" />
              <p className="text-xs text-red-500">{inputError.company_segment}</p>
            </div>
          )}
        </div>
      );
      
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Select the category that best describes your business size and type.",
        companyTypeContent
      )
    
    case 'company_description':
      const companyDescriptionContent = (
        <div className="space-y-4">
          <Label htmlFor="company_description" className="text-white">
            Company Description
          </Label>
          
          {/* WYSIWYG Markdown Editor with improved width and scrolling */}
          <div className={`w-full ${aiMode ? 'max-w-none' : ''}`}>
            <MarkdownEditor
              value={typeof companyDescription === 'string' ? companyDescription : companyDescription ? String(companyDescription) : ''}
              onChange={(value) => setCompanyDescription(value)}
              error={getFieldError('company_description') || undefined}
              placeholder="Briefly describe what your company does, your products/services, and what makes you unique..."
              minHeight={aiMode ? "300px" : "400px"}
              className={aiMode ? "max-h-[40vh] overflow-y-auto" : "max-h-[60vh] overflow-y-auto"}
            />
          </div>
          
          {/* Add a simple help text */}
          <p className="text-gray-400 text-xs">
            Use the toolbar above to format your text. Select text and click a formatting button to apply styles.
          </p>
        </div>
      );
      
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Describe your business to help our AI understand your unique value proposition.",
        companyDescriptionContent
      )
      
    case 'privacy_policy':
      return renderStepWithOptionalHeader(
        currentStep.group,
        "For compliant advertising, we need some additional information about your website.",
        renderTextField(
          'privacy_policy_link',
          'Privacy Policy URL',
          privacyPolicyLink,
          (e) => setPrivacyPolicyLink(e.target.value),
          'https://example.com/privacy-policy',
          'url'
        )
      )
      
    case 'preferred_language':
      const languageContent = (
        <div className="space-y-2">
          <Label className="text-white">Preferred Language</Label>
          <Select 
            value={preferredLanguage} 
            onValueChange={setPreferredLanguage}
          >
            <SelectTrigger 
              className="bg-[#151925] border-gray-700 text-white focus:border-[#4BF29C] focus:ring-[#4BF29C]/10"
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D29] border-gray-700">
              <SelectItem 
                value="en" 
                className="text-white focus:bg-[#151925] focus:text-white data-[highlighted]:bg-[#151925]"
              >
                English
              </SelectItem>
              <SelectItem 
                value="de" 
                className="text-white focus:bg-[#151925] focus:text-white data-[highlighted]:bg-[#151925]"
              >
                German
              </SelectItem>
              <SelectItem 
                value="fr" 
                className="text-white focus:bg-[#151925] focus:text-white data-[highlighted]:bg-[#151925]"
              >
                French
              </SelectItem>
              <SelectItem 
                value="es" 
                className="text-white focus:bg-[#151925] focus:text-white data-[highlighted]:bg-[#151925]"
              >
                Spanish
              </SelectItem>
            </SelectContent>
          </Select>
          
          {inputError.preferred_language && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="size-3.5 text-red-500" />
              <p className="text-xs text-red-500">{inputError.preferred_language}</p>
            </div>
          )}
        </div>
      );
      
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Set your preferences for campaign language and targeting.",
        languageContent
      )

    case 'locations':
      const locationsContent = (
        <div className="space-y-4">
          <OnboardingLocationSelector
            locations={locations || []}
            setLocations={setLocations as React.Dispatch<React.SetStateAction<any>>}
          />
          
          {inputError.locations && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="size-3.5 text-red-500" />
              <p className="text-xs text-red-500">{inputError.locations}</p>
            </div>
          )}
        </div>
      );
      
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Select the geographical areas where you want to target your campaigns.",
        locationsContent
      )

    case 'confirm':
      const confirmContent = (
        <div className="space-y-4">
          <div className="bg-[#1A1D29] rounded-lg border border-gray-700 divide-y divide-gray-700">
            <div className="p-4">
              <h3 className="text-white font-medium mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-xs">First Name</p>
                  <p className="text-white text-sm">{firstName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Last Name</p>
                  <p className="text-white text-sm">{lastName || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-white font-medium mb-3">Company Information</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-gray-400 text-xs">Company Name</p>
                  <p className="text-white text-sm">{companyName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Company Type</p>
                  <p className="text-white text-sm">{SEGMENT_OPTIONS[companySegment as keyof typeof SEGMENT_OPTIONS] || 'Not selected'}</p>
                </div>
                {/* Company description is hidden as requested, but still saved in the profile */}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-white font-medium mb-3">Website Information</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-gray-400 text-xs">Website URL</p>
                  <p className="text-white text-sm">{websiteLink || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Privacy Policy URL</p>
                  <p className="text-white text-sm">{privacyPolicyLink || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-white font-medium mb-3">Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-xs">Preferred Language</p>
                  <p className="text-white text-sm">
                    {preferredLanguage === 'en' ? 'English' : 
                     preferredLanguage === 'de' ? 'German' : 
                     preferredLanguage === 'fr' ? 'French' : 
                     preferredLanguage === 'es' ? 'Spanish' : 'Not selected'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Location Targeting</p>
                  <p className="text-white text-sm">
                    {locations && locations.length > 0 
                      ? `${locations.length} ${locations.length === 1 ? 'location' : 'locations'} selected` 
                      : 'No locations selected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Facebook Connection Status is hidden in this UI version as requested */}
          </div>
          
          <div className="bg-[#4BF29C]/10 border border-[#4BF29C]/30 rounded-lg p-4">
            <p className="text-[#4BF29C] text-sm">
              By clicking &quot;Save & Complete&quot;, your profile will be created and you&apos;ll be ready to create your first AI-powered campaign.
            </p>
          </div>
        </div>
      );
      
      return renderStepWithOptionalHeader(
        currentStep.group,
        "Review your information and complete your profile setup.",
        confirmContent
      )

    default:
      console.error(`Unknown step ID: ${currentStep.id}`)
      return renderStepWithOptionalHeader(
        "Unknown Step",
        "Something went wrong. Please try reloading the page.",
        <div>
          <p className="text-red-500">Invalid step ID: {currentStep.id}</p>
        </div>
      )
  }
}
