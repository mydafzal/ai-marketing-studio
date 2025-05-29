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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import OnboardingLocationSelector from '../onboarding-location-selector'
import FacebookConnect from '@/components/facebook-connect'
import { MemoizedReactMarkdown } from '@/components/markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownEditor } from '@/components/markdown-editor'

export default function StepContent({ step }: { step: number }) {
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

  // Render content based on current step
  switch (currentStep.id) {
    case 'first_name':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Tell us about yourself so we can personalize your experience.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            {renderTextField(
              'first_name',
              'First Name',
              firstName,
              (e) => setFirstName(e.target.value),
              'Enter your first name'
            )}
          </div>
        </div>
      )
      
    case 'last_name':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Tell us about yourself so we can personalize your experience.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            {renderTextField(
              'last_name',
              'Last Name',
              lastName,
              (e) => setLastName(e.target.value),
              'Enter your last name'
            )}
          </div>
        </div>
      )
      
    case 'company_name':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Tell us about yourself so we can personalize your experience.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            {renderTextField(
              'company_name',
              'Company Name',
              companyName,
              (e) => setCompanyName(e.target.value),
              'Enter your company name'
            )}
          </div>
        </div>
      )
      
    case 'website_analysis':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              {userDetails?.defaultExtraDetails 
                ? "Update your website URL. Website analysis is optional for profile updates."
                : "Provide your website URL so our AI can analyze your business and customize your campaigns."
              }
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
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
            
            {/* Analysis status */}
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
          </div>
        </div>
      )
      
    case 'company_type':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Select the category that best describes your business size and type.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white">Company Size & Type</Label>
              <RadioGroup 
                value={companySegment} 
                onValueChange={setCompanySegment}
                className="space-y-2"
              >
                {Object.entries(SEGMENT_OPTIONS).map(([key, label]) => (
                  <div 
                    key={key}
                    className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${companySegment === key 
                      ? 'border-[#4BF29C] bg-[#4BF29C]/5' 
                      : 'border-gray-700 bg-[#151925] hover:border-gray-600 hover:bg-[#1A1D29]'}`}
                  >
                    <RadioGroupItem 
                      value={key} 
                      id={`segment-${key}`} 
                      className="border-gray-600 text-[#4BF29C]"
                    />
                    <Label 
                      htmlFor={`segment-${key}`}
                      className={`cursor-pointer font-normal ${companySegment === key ? 'text-white' : 'text-gray-300'}`}
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              {inputError.company_segment && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="size-3.5 text-red-500" />
                  <p className="text-xs text-red-500">{inputError.company_segment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    
    case 'company_description':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Describe your business to help our AI understand your unique value proposition.
            </p>
          </div>
          
          <div className="pt-2 space-y-4">
            <Label htmlFor="company_description" className="text-white">
              Company Description
            </Label>
            
            {/* WYSIWYG Markdown Editor */}
            <MarkdownEditor
              value={typeof companyDescription === 'string' ? companyDescription : companyDescription ? String(companyDescription) : ''}
              onChange={(value) => setCompanyDescription(value)}
              error={getFieldError('company_description') || undefined}
              placeholder="Briefly describe what your company does, your products/services, and what makes you unique..."
              minHeight="400px"
            />
            
            {/* Add a simple help text */}
            <p className="text-gray-400 text-xs">
              Use the toolbar above to format your text. Select text and click a formatting button to apply styles.
            </p>
          </div>
        </div>
      )
      
    case 'privacy_policy':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              For compliant advertising, we need some additional information about your website.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            {renderTextField(
              'privacy_policy_link',
              'Privacy Policy URL',
              privacyPolicyLink,
              (e) => setPrivacyPolicyLink(e.target.value),
              'https://example.com/privacy-policy',
              'url'
            )}
            
          </div>
        </div>
      )
      
    case 'preferred_language':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Set your preferences for campaign language and targeting.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white">Preferred Language</Label>
              <RadioGroup 
                value={preferredLanguage} 
                onValueChange={setPreferredLanguage}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${preferredLanguage === 'en' 
                    ? 'border-[#4BF29C] bg-[#4BF29C]/5' 
                    : 'border-gray-700 bg-[#151925] hover:border-gray-600 hover:bg-[#1A1D29]'}`}
                >
                  <RadioGroupItem 
                    value="en" 
                    id="lang-en" 
                    className="border-gray-600 text-[#4BF29C]"
                  />
                  <Label 
                    htmlFor="lang-en"
                    className={`cursor-pointer font-normal ${preferredLanguage === 'en' ? 'text-white' : 'text-gray-300'}`}
                  >
                    English
                  </Label>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${preferredLanguage === 'de' 
                    ? 'border-[#4BF29C] bg-[#4BF29C]/5' 
                    : 'border-gray-700 bg-[#151925] hover:border-gray-600 hover:bg-[#1A1D29]'}`}
                >
                  <RadioGroupItem 
                    value="de" 
                    id="lang-de" 
                    className="border-gray-600 text-[#4BF29C]"
                  />
                  <Label 
                    htmlFor="lang-de"
                    className={`cursor-pointer font-normal ${preferredLanguage === 'de' ? 'text-white' : 'text-gray-300'}`}
                  >
                    German
                  </Label>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${preferredLanguage === 'fr' 
                    ? 'border-[#4BF29C] bg-[#4BF29C]/5' 
                    : 'border-gray-700 bg-[#151925] hover:border-gray-600 hover:bg-[#1A1D29]'}`}
                >
                  <RadioGroupItem 
                    value="fr" 
                    id="lang-fr" 
                    className="border-gray-600 text-[#4BF29C]"
                  />
                  <Label 
                    htmlFor="lang-fr"
                    className={`cursor-pointer font-normal ${preferredLanguage === 'fr' ? 'text-white' : 'text-gray-300'}`}
                  >
                    French
                  </Label>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${preferredLanguage === 'es' 
                    ? 'border-[#4BF29C] bg-[#4BF29C]/5' 
                    : 'border-gray-700 bg-[#151925] hover:border-gray-600 hover:bg-[#1A1D29]'}`}
                >
                  <RadioGroupItem 
                    value="es" 
                    id="lang-es" 
                    className="border-gray-600 text-[#4BF29C]"
                  />
                  <Label 
                    htmlFor="lang-es"
                    className={`cursor-pointer font-normal ${preferredLanguage === 'es' ? 'text-white' : 'text-gray-300'}`}
                  >
                    Spanish
                  </Label>
                </div>
              </RadioGroup>
              
              {inputError.preferred_language && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="size-3.5 text-red-500" />
                  <p className="text-xs text-red-500">{inputError.preferred_language}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )

    case 'locations':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Select the geographical areas where you want to target your campaigns.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
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
        </div>
      )

    case 'confirm':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{currentStep.group}</h2>
            <p className="text-gray-400 text-sm">
              Review your information and complete your profile setup.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
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
                  <div>
                    <p className="text-gray-400 text-xs">Company Description</p>
                    {companyDescription ? (
                      <div className="text-white text-sm overflow-auto max-h-80" 
                           dangerouslySetInnerHTML={{ __html: typeof companyDescription === 'string' ? companyDescription : String(companyDescription) }}>
                      </div>
                    ) : (
                      <p className="text-white text-sm">Not provided</p>
                    )}
                  </div>
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

              {/* Facebook Connection Status */}
              <div className="p-4">
                <h3 className="text-white font-medium mb-3">Facebook Connection</h3>
                <div className="flex items-center gap-3">
                  <Facebook className="size-4 text-[#1877F2]" />
                  <p className="text-sm text-gray-300">
                    {userDetails?.fbAccountId 
                      ? 'Connected to Facebook' 
                      : 'Not connected to Facebook (optional)'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#4BF29C]/10 border border-[#4BF29C]/30 rounded-lg p-4">
              <p className="text-[#4BF29C] text-sm">
                By clicking &quot;Save & Complete&quot;, your profile will be created and you&apos;ll be ready to create your first AI-powered campaign.
              </p>
            </div>
          </div>
        </div>
      )

    default:
      console.error(`Unknown step ID: ${currentStep.id}`)
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Unknown Step</h2>
            <p className="text-gray-400 text-sm">
              Something went wrong. Please try reloading the page.
            </p>
          </div>
        </div>
      )
  }
}
