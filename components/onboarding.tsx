import React, {SetStateAction} from 'react'
import * as Dialog from "@radix-ui/react-dialog"
import {type User} from '@/lib/types'
import {Cross2Icon} from "@radix-ui/react-icons"
import {Button} from '@/components/ui/button'
import {subscriptionBypassList} from '@/app/subscription/subscription-bypass-list'
import {
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Loader2, 
  MapPin,
  Save,
  Search, 
  Target, 
  User as UserIcon, 
  FileText, 
  CheckCheck
} from 'lucide-react'
import {cn} from '@/lib/utils'
import OnboardingLocationSelector, { LocationData } from './onboarding-location-selector'
import posthog from 'posthog-js'

type Details = {
    first_name: string | null
    last_name: string | null
    company_name: string | null
    company_description: string | null
    website_link: string | null
    privacy_policy_link: string | null
    preferred_language: string | null
    goal: string | null
    company_segment: string | null
    locations?: LocationData
}

type InputErrors = {
    first_name: string | null
    last_name: string | null
    company_name: string | null
    company_description: string | null
    website_link: string | null
    privacy_policy_link: string | null
    preferred_language: string | null
    goal: string | null
    company_segment: string | null
    locations?: string | null
}

type OnboardingProps = {
    userDetails: User | undefined
    open: boolean
    setOpen: React.Dispatch<SetStateAction<boolean>>
    updateOnboardingDetails: (email: string, details: {
        first_name: string
        last_name: string
        company_name: string
        company_description: string
        website_link: string
        privacy_policy_link: string
        preferred_language: string
        goal: string
        company_segment: string
        locations?: LocationData
    }) => Promise<any>
}

const GOAL_OPTIONS = {
    GENERATE_LEADS: "I want to generate more leads",
    RECRUIT_EMPLOYEES: "I want to recruit employees",
    INCREASE_CONVERSIONS: "I want to increase conversions",
} as const;

const SEGMENT_OPTIONS = {
    FREELANCER: "Freelancer / Sole Proprietor",
    STARTUP: "Startup (1–10 employees)",
    SMALL_BUSINESS: "Small Business (11–50 employees)",
    MID_SIZED: "Mid-Sized Company (51–200 employees)",
    ENTERPRISE: "Large Enterprise (200+ employees)",
    NONPROFIT: "Nonprofit / NGO",
    EDUCATION: "Educational Institution",
    GOVERNMENT: "Government / Public Sector",
    OTHER: "Other"
} as const;

// Define the steps for the onboarding process
const STEPS = [
    { 
        id: 'personal', 
        title: 'Personal Information', 
        fields: ['first_name', 'last_name'] 
    },
    { 
        id: 'company', 
        title: 'Company Information', 
        fields: ['company_name', 'company_segment', 'company_description'] 
    },
    { 
        id: 'website', 
        title: 'Website Details', 
        fields: ['website_link', 'privacy_policy_link'] 
    },
    { 
        id: 'preferences', 
        title: 'Preferences', 
        fields: ['preferred_language'] 
    },
    { 
        id: 'locations', 
        title: 'Preferred Locations', 
        fields: ['locations'] 
    },
    { 
        id: 'confirm', 
        title: 'Confirm & Save', 
        fields: [] 
    },
];

// Benefits panel component for the right side of the dialog on desktop
// Or for displaying at the bottom of each step on mobile
const BenefitsPanel = ({ currentStep }: { currentStep: number }) => {
  switch(currentStep) {
    case 0: // Personal Information
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Clock className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">30x Faster Campaign Creation</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4">
              Traditional campaign setup takes 30+ minutes. Reeply AI does it all automatically in seconds.
            </p>
            <div className="flex items-center justify-between bg-[#151925] p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="text-gray-400">Traditional:</div>
                <div className="text-white font-medium">30+ min</div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="text-gray-400">Reeply AI:</div>
                <div className="text-[#4BF29C] font-semibold">60 sec</div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#151925] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-3 h-3 sm:w-4 sm:h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-white italic text-xs sm:text-sm mb-3 sm:mb-4">
              &ldquo;We now generate 80% of our leads through campaigns managed with Reeply AI. Thanks to the consistently excellent support, we look forward to planning and executing more projects with Max and Reeply AI in the future.&rdquo;
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/Christian.png" alt="Christian Schmitt" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
              <div>
                <div className="text-white text-xs sm:text-sm font-medium">Christian Schmitt</div>
                <div className="text-gray-400 text-[10px] sm:text-xs">Business owner at Boldbrands</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 1: // Company Information
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Search className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Smart Website Analysis</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Reeply AI scans your website URL to understand your business, audience, and products—automatically selecting the perfect campaign type for your goals.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <FileText className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">AI-Generated Ad Copy</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Based on your company description, our AI writes compelling ad text that resonates with your audience and highlights your unique value proposition.
            </p>
          </div>
        </div>
      );
      
    case 2: // Website Details
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Streamlined Process</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">1</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Website Link</div>
                  <div className="text-gray-400 text-xs sm:text-sm">You provide your website</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">2</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Smart Analysis</div>
                  <div className="text-gray-400 text-xs sm:text-sm">AI analyzes your website</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">3</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Ad Creation</div>
                  <div className="text-gray-400 text-xs sm:text-sm">AI creates your ad campaign</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-white text-xs sm:text-sm">4</div>
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">Lead Generation</div>
                  <div className="text-gray-400 text-xs sm:text-sm">You get leads immediately</div>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <div className="text-gray-400">Traditional:</div>
                <div className="text-white">30-60+ min</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-gray-400">Reeply AI:</div>
                <div className="text-[#4BF29C] font-semibold">Under 60 sec</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 3: // Preferences
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Globe className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Intelligent Geo-Targeting</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Reeply AI determines optimal geolocation targeting from your website and profile preferences, ensuring your ads reach the right audience in the right locations.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Target className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Advanced Audience Targeting</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              Our AI agent researches the best potential filters on Meta Ads to target your ideal audience, finding hidden opportunities other marketers might miss.
            </p>
          </div>
        </div>
      );

    case 4: // Locations
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <MapPin className="size-4 sm:size-5 text-[#4BF29C]" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Targeted Local Advertising</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              By setting your preferred locations, you help our AI target your campaigns more effectively to the regions that matter most to your business.
            </p>
          </div>
          
          <div className="bg-[#1A1D29] rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Benefits of Location Targeting</h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-[#4BF29C] text-xs sm:text-base">✓</div>
                <div className="text-gray-300 text-xs sm:text-sm">Higher conversion rates from local audiences</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-[#4BF29C] text-xs sm:text-base">✓</div>
                <div className="text-gray-300 text-xs sm:text-sm">Reduced ad spend wastage on irrelevant regions</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#151925] flex items-center justify-center text-[#4BF29C] text-xs sm:text-base">✓</div>
                <div className="text-gray-300 text-xs sm:text-sm">More relevant messaging for specific geographic areas</div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 5: // Confirmation
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#1A1D29] rounded-xl border border-[#4BF29C]/30 p-4 sm:p-6">
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#4BF29C]/20 flex items-center justify-center">
                <CheckCheck className="size-6 sm:size-8 text-[#4BF29C]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Your Profile is Ready!</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                You&apos;re all set to create your first AI-powered campaign in 60 seconds.
              </p>
            </div>
            
            <div className="bg-[#151925] rounded-lg p-3 sm:p-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-3 h-3 sm:w-4 sm:h-4 text-[#4BF29C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-white italic text-xs sm:text-sm my-2 sm:my-3">
                &ldquo;I loved working with the Reeply team - dedicated, patient, professional. They are experienced and were able to jump in to problem solve, no matter how big or small the problem. I enjoyed using the Reeply platform to help me get started on my Meta ads journey. It&apos;s simple and easy to use. They helped me to launch my very first lead generation, awareness, and conversion ads. It was easy to see all my campaign results in one handy interface. I managed to gain half a million views on one of my videos in just a few days. I also gained a lot of insights on what kind of ads worked, and what didn&apos;t work. Thank you Reeply.&rdquo;
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <img src="/lin.png" alt="Lin Loke" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
                <div>
                  <div className="text-white text-xs sm:text-sm font-medium">Lin Loke</div>
                  <div className="text-gray-400 text-[10px] sm:text-xs">Founder of Nuwa Wellness</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
    default:
      return null;
  }
};

function Onboarding({
    userDetails,
    open,
    setOpen,
    updateOnboardingDetails
}: OnboardingProps) {
    const [error, setError] = React.useState<string | null>(null)
    const [inputError, setInputError] = React.useState<InputErrors>({
        first_name: "",
        last_name: "",
        company_name: "",
        company_description: "",
        website_link: "",
        privacy_policy_link: "",
        preferred_language: "",
        goal: "",
        company_segment: ""
    })

    const [firstName, setFirstName] = React.useState<string>(userDetails?.first_name || "")
    const [lastName, setLastName] = React.useState<string>(userDetails?.last_name || "")
    const [companyName, setCompanyName] = React.useState<string>(userDetails?.company_name || "")
    const [companyDescription, setCompanyDescription] = React.useState<string>(userDetails?.company_description || "")
    const [websiteLink, setWebsiteLink] = React.useState<string>(userDetails?.website_link || "")
    const [privacyPolicyLink, setPrivacyPolicyLink] = React.useState<string>(userDetails?.privacy_policy_link || "")
    const [preferredLanguage, setPreferredLanguage] = React.useState<string>(userDetails?.preferred_language || "en")
    const [goal, setGoal] = React.useState<string>(userDetails?.goal || "")
    const [companySegment, setCompanySegment] = React.useState<string>(userDetails?.company_segment || "")
    const [locations, setLocations] = React.useState<LocationData | undefined>(userDetails?.locations)

    const [dbChangeRequested, setDbChangeRequested] = React.useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = React.useState(false)
    const [currentStep, setCurrentStep] = React.useState(0)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)

    // Check if the device is mobile
    React.useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // Initial check
        checkIfMobile();
        
        // Listen for resize events
        window.addEventListener('resize', checkIfMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Track when the onboarding dialog is opened
    const [dialogOpenedAt, setDialogOpenedAt] = React.useState<number | null>(null);
    
    // When dialog open state changes, record timestamp if opening
    React.useEffect(() => {
        if (open) {
            setDialogOpenedAt(Date.now());
        }
    }, [open]);
    
    // Update states only when userDetails changes AND the dialog is not open
    // This prevents reloading locations from database after user has deleted them
    React.useEffect(() => {
        // Only load userDetails when dialog is not open OR was just opened
        const isInitialLoad = dialogOpenedAt && (Date.now() - dialogOpenedAt < 1000);
        
        if (userDetails && (!open || isInitialLoad)) {
            console.log("[TEMPORARY DEBUG] Loading userDetails:", userDetails);
            
            setFirstName(userDetails.first_name || "")
            setLastName(userDetails.last_name || "")
            setCompanyName(userDetails.company_name || "")
            setCompanyDescription(userDetails.company_description || "")
            setWebsiteLink(userDetails.website_link || "")
            setPrivacyPolicyLink(userDetails.privacy_policy_link || "")
            setPreferredLanguage(userDetails.preferred_language || "en")
            setGoal(userDetails.goal || "")
            setCompanySegment(userDetails.company_segment || "")
            
            // Handle locations - may be stored as JSON string in database
            if (userDetails.locations) {
                try {
                    // If it's stored as a string, parse it
                    if (typeof userDetails.locations === 'string') {
                        console.log("[TEMPORARY DEBUG] Parsing locations from string:", userDetails.locations);
                        const parsedLocations = JSON.parse(userDetails.locations);
                        console.log("[TEMPORARY DEBUG] Parsed locations:", parsedLocations);
                        setLocations(parsedLocations);
                    } else {
                        // Otherwise use it as is
                        console.log("[TEMPORARY DEBUG] Using locations as object:", userDetails.locations);
                        setLocations(userDetails.locations);
                    }
                } catch (error) {
                    console.error('[TEMPORARY DEBUG] Error parsing locations:', error);
                }
            } else {
                console.log("[TEMPORARY DEBUG] No locations found");
                // Reset locations to empty array to ensure it's not undefined
                setLocations([]);
            }
        }
    }, [userDetails, open, dialogOpenedAt])

    // Validate the current step and move to the next if valid
    const validateStep = () => {
        // Skip validation for confirmation step
        if (currentStep >= STEPS.length - 1) return true;
        
        const currentFields = STEPS[currentStep].fields;
        const errors: InputErrors = { ...inputError };
        let hasErrors = false;
        
        // Handle special case for locations step
        if (STEPS[currentStep].id === 'locations') {
            return true; // Locations are optional, so always allow proceeding
        }
        
        // Validate other fields
        currentFields.forEach(field => {
            let value = "";
            switch(field) {
                case 'first_name': value = firstName; break;
                case 'last_name': value = lastName; break;
                case 'company_name': value = companyName; break;
                case 'company_description': value = companyDescription; break;
                case 'website_link': value = websiteLink; break;
                case 'privacy_policy_link': value = privacyPolicyLink; break;
                case 'preferred_language': value = preferredLanguage; break;
                case 'goal': value = goal; break;
                case 'company_segment': value = companySegment; break;
                case 'locations': 
                    // Locations are optional, so skip validation
                    return;
                default:
                    return;
            }
            
            if (!value || value.trim() === "") {
                errors[field as keyof InputErrors] = "This field is required";
                hasErrors = true;
            } else {
                errors[field as keyof InputErrors] = "";
            }
        });
        
        setInputError(errors);
        return !hasErrors;
    };

    const handleNextStep = () => {
        if (validateStep()) {
            const nextStep = Math.min(currentStep + 1, STEPS.length - 1);
            setCurrentStep(nextStep);
            // Scroll to top when changing steps on mobile
            if (isMobile) {
                window.scrollTo(0, 0);
            }
        }
    };

    const handlePrevStep = () => {
        const prevStep = Math.max(currentStep - 1, 0);
        setCurrentStep(prevStep);
        // Scroll to top when changing steps on mobile
        if (isMobile) {
            window.scrollTo(0, 0);
        }
    };

    const handleSave = async () => {
        if (userDetails) {
            // Set loading state
            setIsSaving(true);
            
            // Add temporary debug log for locations before saving
            console.log("[TEMPORARY DEBUG] Saving locations:", locations);
            
            const details = {
                first_name: firstName,
                last_name: lastName,
                company_name: companyName,
                company_description: companyDescription,
                website_link: websiteLink,
                privacy_policy_link: privacyPolicyLink,
                preferred_language: preferredLanguage,
                goal: goal,
                company_segment: companySegment,
                locations: locations
            }

            // Manually set goal since it's removed from the form
            details.goal = "";

            // Validate required fields before saving
            const requiredFields = [
                'first_name', 'last_name', 'company_name', 'company_description', 
                'website_link', 'privacy_policy_link', 'preferred_language', 'company_segment'
            ];
            
            const errors: InputErrors = { ...inputError };
            let hasErrors = false;
            
            requiredFields.forEach(field => {
                let value = "";
                switch(field) {
                    case 'first_name': value = firstName; break;
                    case 'last_name': value = lastName; break;
                    case 'company_name': value = companyName; break;
                    case 'company_description': value = companyDescription; break;
                    case 'company_segment': value = companySegment; break;
                    case 'website_link': value = websiteLink; break;
                    case 'privacy_policy_link': value = privacyPolicyLink; break;
                    case 'preferred_language': value = preferredLanguage; break;
                }
                
                if (!value || value.trim() === "") {
                    errors[field as keyof InputErrors] = "This field is required";
                    hasErrors = true;
                } else {
                    errors[field as keyof InputErrors] = "";
                }
            });
            
            if (hasErrors) {
                setInputError(errors);
                setIsSaving(false);
                
                // Find the first step with errors and navigate to it
                for (let i = 0; i < STEPS.length - 1; i++) {
                    const stepFields = STEPS[i].fields;
                    const hasStepError = stepFields.some(field => {
                        const value = details[field as keyof typeof details];
                        if (!value) return true;
                        if (typeof value === 'string') {
                            return value.trim() === "";
                        }
                        return false;
                    });
                    if (hasStepError) {
                        setCurrentStep(i);
                        return;
                    }
                }
                return;
            }

            setDbChangeRequested(true);

            try {
                console.log("[TEMPORARY DEBUG] Saving locations data:", locations);
                const resp = await updateOnboardingDetails(userDetails?.email, details);
                console.log("[TEMPORARY DEBUG] Save response:", resp);
                
                if (resp.success) {
                    setDbChangeRequested(false);
                    setShowSuccessMessage(true);

                    // Keep the loading state active during the page reload
                    // The loading overlay will remain visible until the page refreshes
                    setTimeout(() => {
                        // Check if user is in bypass list
                        const isInBypassList = userDetails?.email ? subscriptionBypassList.includes(userDetails.email) : false;
                        
                        // Only redirect to onboarding-complete if user is not subscribed and not in bypass list
                        if (userDetails?.sub_status !== 'active' && 
                            userDetails?.sub_status !== 'trialing' && 
                            !isInBypassList) {
                            window.location.href = '/onboarding-complete';
                        } else {
                            // If user is already subscribed or in bypass list, redirect to main app
                            window.location.href = '/';
                        }
                    }, 2000);
                } else {
                    setError(resp.message);
                    setIsSaving(false); // Only disable loading state on error
                }
            } catch (error) {
                setError("An error occurred while saving your profile.");
                console.error("Save error:", error);
                setIsSaving(false); // Only disable loading state on error
            }
        }
    }

    function handleClose() {
        if (!userDetails?.defaultExtraDetails) {
            setError("Please complete your profile setup to proceed.")
        } else {
            setOpen(false)
            // Reset loading state when dialog is closed
            setIsSaving(false)
        }
    }

    React.useEffect(() => {
        setTimeout(() => {
            setShowSuccessMessage(false)
        }, 5000)
    }, [showSuccessMessage])

    // Function to get the value based on field name
    const getFieldValue = (field: string) => {
        switch(field) {
            case 'first_name': return firstName;
            case 'last_name': return lastName;
            case 'company_name': return companyName;
            case 'company_description': return companyDescription;
            case 'website_link': return websiteLink;
            case 'privacy_policy_link': return privacyPolicyLink;
            case 'preferred_language': return preferredLanguage;
            case 'goal': return goal;
            case 'company_segment': return companySegment;
            default: return "";
        }
    };

    // Function to get the field error
    const getFieldError = (field: string) => {
        return inputError[field as keyof InputErrors];
    };

    // Function to render input based on field
    const renderField = (field: string) => {
        const value = getFieldValue(field);
        const fieldError = getFieldError(field);

        switch(field) {
            case 'first_name':
                return (
                    <div className="space-y-2">
                        <label htmlFor="first_name" className="text-sm font-semibold text-white">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="first_name"
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                            placeholder="Enter your first name"
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, first_name: ""})
                                }
                                setFirstName(e.target.value)
                            }}
                        />
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'last_name':
                return (
                    <div className="space-y-2">
                        <label htmlFor="last_name" className="text-sm font-semibold text-white">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="last_name"
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                            placeholder="Enter your last name"
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, last_name: ""})
                                }
                                setLastName(e.target.value)
                            }}
                        />
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'company_name':
                return (
                    <div className="space-y-2">
                        <label htmlFor="company_name" className="text-sm font-semibold text-white">
                            Company Name
                        </label>
                        <input
                            type="text"
                            id="company_name"
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                            placeholder="Enter your company name"
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, company_name: ""})
                                }
                                setCompanyName(e.target.value)
                            }}
                        />
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'company_description':
                return (
                    <div className="space-y-2">
                        <label htmlFor="company_description" className="text-sm font-semibold text-white">
                            Company Description
                        </label>
                        <p className="text-xs text-gray-400">
                            Share your company&apos;s advertising goals and unique details that might not be on your website.
                        </p>
                        <textarea
                            id="company_description"
                            rows={4}
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "resize-none text-white"
                            )}
                            placeholder="Please share your company's advertising goals and any unique details about your company that our AI might not be able to gather from your website."
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, company_description: ""})
                                }
                                setCompanyDescription(e.target.value)
                            }}
                        />
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'website_link':
                return (
                    <div className="space-y-2">
                        <label htmlFor="website_link" className="text-sm font-semibold text-white">
                            Website Link
                        </label>
                        <p className="text-xs text-gray-400">
                            Our AI will analyze your website to better understand your company and provide more relevant suggestions.
                        </p>
                        <input
                            type="text"
                            id="website_link"
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                            placeholder="https://yourwebsite.com"
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, website_link: ""})
                                }
                                setWebsiteLink(e.target.value)
                            }}
                        />
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'privacy_policy_link':
                return (
                    <div className="space-y-2">
                        <label htmlFor="privacy_policy_link" className="text-sm font-semibold text-white">
                            Privacy Policy Link
                        </label>
                        <p className="text-xs text-gray-400">
                            Please provide a link to your company&apos;s privacy policy.
                        </p>
                        <input
                            type="text"
                            id="privacy_policy_link"
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                            placeholder="https://yourwebsite.com/privacy-policy"
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, privacy_policy_link: ""})
                                }
                                setPrivacyPolicyLink(e.target.value)
                            }}
                        />
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'preferred_language':
                return (
                    <div className="space-y-2">
                        <label htmlFor="languages" className="text-sm font-semibold text-white">
                            Preferred Language
                        </label>
                        <p className="text-xs text-gray-400">
                            Select the language you prefer for AI-generated content.
                        </p>
                        <select
                            id="languages"
                            value={value}
                            onChange={(e) => {
                                if (e.target.value.length > 0) {
                                    setInputError({...inputError, preferred_language: ""})
                                }
                                setPreferredLanguage(e.target.value)
                            }}
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                        >
                            <option value="en">English</option>
                            <option value="nl">Dutch</option>
                            <option value="de">German</option>
                            <option value="es">Spanish</option>
                            <option value="it">Italian</option>
                            <option value="fr">French</option>
                            <option value="pt">Portuguese</option>
                        </select>
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'company_segment':
                return (
                    <div className="space-y-2">
                        <label htmlFor="company_segment" className="text-sm font-semibold text-white">
                            Company Segment
                        </label>
                        <p className="text-xs text-gray-400">
                            Select the category that best describes your organization.
                        </p>
                        <select
                            id="company_segment"
                            value={value}
                            onChange={(e) => {
                                const selectedSegment = e.target.value;
                                if (selectedSegment.length > 0) {
                                    setInputError({...inputError, company_segment: ""})
                                    
                                    // Set company_segment as a person property
                                    posthog.capture('$set', {
                                        $set: {
                                            company_segment: selectedSegment,
                                            company_segment_name: SEGMENT_OPTIONS[selectedSegment as keyof typeof SEGMENT_OPTIONS]
                                        }
                                    });

                                    // Track segment selection event
                                    posthog.capture('company_segment_selected', {
                                        segment: selectedSegment,
                                        segment_name: SEGMENT_OPTIONS[selectedSegment as keyof typeof SEGMENT_OPTIONS],
                                        previous_segment: companySegment,
                                        previous_segment_name: companySegment ? SEGMENT_OPTIONS[companySegment as keyof typeof SEGMENT_OPTIONS] : null
                                    });
                                }
                                setCompanySegment(selectedSegment)
                            }}
                            className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                                "bg-[#1A1D29] dark:bg-[#1A1D29] border",
                                fieldError
                                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                                    : "border-gray-700 dark:border-gray-700 focus:border-[#4BF29C] dark:focus:border-[#4BF29C]",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]",
                                "text-white"
                            )}
                        >
                            <option value="">Select a segment</option>
                            {Object.entries(SEGMENT_OPTIONS).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                        {fieldError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="size-3"/>
                                {fieldError}
                            </p>
                        )}
                    </div>
                );
            case 'locations':
                return (
                    <div className="space-y-4">
                        <OnboardingLocationSelector 
                            locations={locations || []}
                            setLocations={setLocations as React.Dispatch<React.SetStateAction<LocationData>>}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    // Render confirmation step
    const renderConfirmation = () => {
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="bg-[#1A1D29] dark:bg-[#1A1D29] p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">First Name</p>
                            <p className="text-sm sm:text-base text-white">{firstName}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Last Name</p>
                            <p className="text-sm sm:text-base text-white">{lastName}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-[#1A1D29] dark:bg-[#1A1D29] p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Company Information</h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Company Name</p>
                            <p className="text-sm sm:text-base text-white">{companyName}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Company Segment</p>
                            <p className="text-sm sm:text-base text-white">{SEGMENT_OPTIONS[companySegment as keyof typeof SEGMENT_OPTIONS] || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Company Description</p>
                            <p className="text-sm sm:text-base text-white">{companyDescription}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-[#1A1D29] dark:bg-[#1A1D29] p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Website Details</h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Website Link</p>
                            <p className="text-sm sm:text-base text-white break-words">{websiteLink}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Privacy Policy Link</p>
                            <p className="text-sm sm:text-base text-white break-words">{privacyPolicyLink}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-[#1A1D29] dark:bg-[#1A1D29] p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Preferences</h3>
                    <div>
                        <p className="text-xs sm:text-sm text-gray-400">Preferred Language</p>
                        <p className="text-sm sm:text-base text-white">{
                            preferredLanguage === 'en' ? 'English' :
                            preferredLanguage === 'nl' ? 'Dutch' :
                            preferredLanguage === 'de' ? 'German' :
                            preferredLanguage === 'es' ? 'Spanish' :
                            preferredLanguage === 'it' ? 'Italian' :
                            preferredLanguage === 'fr' ? 'French' : preferredLanguage
                        }</p>
                    </div>
                </div>
                
                
                {/* Always show a locations section, with debug info if no locations */}
                <div className="bg-[#1A1D29] dark:bg-[#1A1D29] p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                        <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#4BF29C]" />
                            Preferred Locations
                        </span>
                    </h3>
                    
                    {(!locations || locations.length === 0) ? (
                        <div className="py-2 sm:py-3 px-3 sm:px-4 bg-[#151925] rounded-lg">
                            <p className="text-gray-400 text-xs sm:text-sm">No locations selected</p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {locations.map((loc, idx) => (
                                <div key={idx} className="border-b border-gray-700 pb-3 last:border-0 last:pb-0">
                                    <p className="text-sm sm:text-base text-white font-medium">{loc.country.name}</p>
                                    {loc.regions.map((region, regionIdx) => (
                                        <div key={regionIdx} className="ml-3 sm:ml-4 mt-2">
                                            <p className="text-xs sm:text-sm text-gray-300">{region.name}</p>
                                            {region.cities && region.cities.length > 0 && (
                                                <div className="ml-3 sm:ml-4 mt-1 flex flex-wrap gap-1 sm:gap-2">
                                                    {region.cities.map((city, cityIdx) => (
                                                        <span 
                                                            key={cityIdx} 
                                                            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs bg-[#232736] text-gray-300"
                                                        >
                                                            {city.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {showSuccessMessage && (
                <div className={cn(
                    "my-2 sm:my-4 flex items-center gap-1 sm:gap-2 p-3 sm:p-4 text-xs sm:text-sm rounded-lg",
                    "bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-400",
                    "border border-green-200 dark:border-green-900/50",
                    "animate-in fade-in-0 duration-300"
                )}>
                    <CheckCircle2 className="size-3 sm:size-4 shrink-0"/>
                    <span>Your profile has been updated successfully</span>
                </div>
            )}

            {!open && dbChangeRequested && (
                <div className={cn(
                    "my-2 sm:my-4 flex items-center gap-1 sm:gap-2 p-3 sm:p-4 text-xs sm:text-sm rounded-lg",
                    "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400",
                    "border border-yellow-200 dark:border-yellow-900/50",
                    "animate-in fade-in-0 duration-300"
                )}>
                    <Loader2 className="size-3 sm:size-4 shrink-0 animate-spin"/>
                    <span>Updating your profile. This may take a few seconds...</span>
                </div>
            )}

            <Dialog.Root open={open} onOpenChange={() => {
                if (userDetails?.defaultExtraDetails) {
                    setOpen(!open)
                    // Reset loading state when dialog is closed
                    if (open) setIsSaving(false)
                } else {
                    setError("Please complete your profile setup to proceed.")
                }
            }}>
                <Dialog.Trigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 hover:bg-[#1A1D29] dark:hover:bg-[#1A1D29] text-white"
                    >
                        <UserIcon className="size-4"/>
                        Profile
                    </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                    <Dialog.Overlay
                        className={cn(
                            "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                        )}
                    />
                    <Dialog.Content
                        className={cn(
                            "fixed inset-0 z-50 flex h-full w-full",
                            "bg-[#0F1117] dark:bg-[#0F1117] text-white",
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                            "overflow-y-auto overflow-x-hidden"
                        )}
                    >
                        {/* Split screen layout */}
                        <div className="flex flex-col md:flex-row h-full w-full max-w-[1400px] mx-auto">
                            {/* Left column - Form (100% on mobile, 60% on tablet/desktop) */}
                            <div className="w-full md:w-3/5 h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-auto">
                                {/* Progress indicator */}
                                <div className="w-full mb-6 lg:mb-8">
                                    <div className="hidden sm:flex justify-between items-center w-full mb-2">
                                        {STEPS.map((step, index) => (
                                            <button 
                                                key={step.id}
                                                onClick={() => setCurrentStep(index)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center",
                                                    "transition-all duration-200",
                                                    currentStep >= index ? "text-[#4BF29C]" : "text-gray-500"
                                                )}
                                            >
                                                <div className={cn(
                                                    "rounded-full flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2",
                                                    "border-2 transition-all duration-200",
                                                    currentStep > index 
                                                        ? "bg-[#4BF29C] border-[#4BF29C]" 
                                                        : currentStep === index
                                                            ? "border-[#4BF29C] text-[#4BF29C]"
                                                            : "border-gray-700 text-gray-500"
                                                )}>
                                                    {currentStep > index ? (
                                                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#0F1117]" />
                                                    ) : (
                                                        <span>{index + 1}</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-medium hidden sm:block">{step.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Mobile Stepper - Just show current step */}
                                    <div className="flex sm:hidden items-center justify-center mb-4">
                                        <span className="text-sm text-gray-400">Step {currentStep + 1} of {STEPS.length}</span>
                                    </div>
                                    
                                    <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-purple-500 to-[#4BF29C] h-full transition-all duration-300 ease-in-out" 
                                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <Dialog.Title className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 sm:mb-4">
                                    {STEPS[currentStep].title} <span className="text-sm sm:text-base text-gray-400">(Step {currentStep + 1}/{STEPS.length})</span>
                                </Dialog.Title>

                                <Dialog.Description className="text-sm sm:text-base lg:text-lg text-gray-400 mb-4 sm:mb-6 lg:mb-8">
                                    {currentStep === STEPS.length - 1 
                                        ? "Please review your information before saving."
                                        : "Complete your profile to get the most out of our platform."}
                                </Dialog.Description>

                                {error && (
                                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center text-sm sm:text-base">
                                        {error}
                                    </div>
                                )}

                                {/* Navigation buttons - mobile positioning at top */}
                                {isMobile && (
                                    <div className="flex justify-between mb-6 sticky top-0 z-30 bg-[#0F1117] py-3">
                                        <button
                                            onClick={handlePrevStep}
                                            className={cn(
                                                "px-3 py-2 rounded-lg flex items-center gap-1 text-sm",
                                                "bg-[#1A1D29] text-white border border-gray-700",
                                                "transition-all duration-200 hover:bg-[#232736]",
                                                currentStep === 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            disabled={currentStep === 0}
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                            Back
                                        </button>
                                        
                                        {currentStep === STEPS.length - 1 ? (
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-3 py-2 rounded-lg flex items-center gap-1 text-sm bg-gradient-to-r from-[#4BF29C] to-[#38A169] hover:brightness-110 text-[#0F1117] font-medium transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        Save
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleNextStep}
                                                className="px-3 py-2 rounded-lg flex items-center gap-1 text-sm bg-gradient-to-r from-[#4BF29C] to-[#38A169] hover:brightness-110 text-[#0F1117] font-medium transition-all duration-200"
                                            >
                                                Next
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar min-h-[200px] pb-20">
                                    {currentStep === STEPS.length - 1 
                                        ? renderConfirmation()
                                        : STEPS[currentStep].fields.map(field => (
                                            <div key={field}>
                                                {renderField(field)}
                                            </div>
                                        ))
                                    }
                                </div>

                                {/* Navigation buttons - desktop positioning */}
                                {!isMobile && (
                                    <div className="flex justify-between border-t border-gray-800 pt-4 mt-6 relative z-10">
                                        <button
                                            onClick={handlePrevStep}
                                            className={cn(
                                                "px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base",
                                                "bg-[#1A1D29] text-white border border-gray-700",
                                                "transition-all duration-200 hover:bg-[#232736] hover:scale-[1.02]",
                                                currentStep === 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            disabled={currentStep === 0}
                                        >
                                            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Previous
                                        </button>
                                        
                                        {currentStep === STEPS.length - 1 ? (
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base bg-gradient-to-r from-[#4BF29C] to-[#38A169] hover:brightness-110 text-[#0F1117] font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:pointer-events-none"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        Save Profile
                                                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleNextStep}
                                                className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base bg-gradient-to-r from-[#4BF29C] to-[#38A169] hover:brightness-110 text-[#0F1117] font-medium transition-all duration-200 hover:scale-[1.02]"
                                            >
                                                Next
                                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Right column - Benefits (hidden on mobile phones, 40% on tablet/desktop) */}
                            <div className="hidden md:block md:w-2/5 h-full bg-[#151925] p-8 border-l border-[#2A2E3A] overflow-y-auto">
                                <BenefitsPanel currentStep={currentStep} />
                            </div>
                        </div>
                        
                        {/* Full-screen loading overlay */}
                        {isSaving && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                                <div className="bg-[#1A1D29] p-5 sm:p-8 rounded-xl flex flex-col items-center max-w-xs sm:max-w-md mx-auto m-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#4BF29C]/20 flex items-center justify-center mb-3 sm:mb-4">
                                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#4BF29C] animate-spin" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">Saving Your Profile</h3>
                                    <p className="text-gray-400 text-center text-sm sm:text-base mb-4 sm:mb-6">
                                        Please wait while we save your profile information. 
                                        This will only take a moment.
                                    </p>
                                    <div className="w-full bg-[#151925] h-1.5 sm:h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-[#4BF29C] animate-pulse" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Close button */}
                        <Dialog.Close className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full bg-[#1A1D29] text-gray-400 hover:text-white hover:bg-[#232736] transition-colors z-10">
                            <Cross2Icon className="size-3 sm:size-4" />
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1A1D29;
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2A2E3A;
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3A3E4A;
                }
            `}</style>
        </>
    )
}

export default Onboarding