import React, { createContext, useContext, useState, useEffect } from 'react'
import { subscriptionBypassList } from '@/app/subscription/subscription-bypass-list'
import { LocationData } from '../onboarding-location-selector'
import { Details, InputErrors, OnboardingProps, WebsiteAnalysisData, STEPS } from './types'

type OnboardingContextType = {
    currentStep: number
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
    firstName: string
    setFirstName: React.Dispatch<React.SetStateAction<string>>
    lastName: string
    setLastName: React.Dispatch<React.SetStateAction<string>>
    companyName: string
    setCompanyName: React.Dispatch<React.SetStateAction<string>>
    companyDescription: string
    setCompanyDescription: React.Dispatch<React.SetStateAction<string>>
    websiteLink: string
    setWebsiteLink: React.Dispatch<React.SetStateAction<string>>
    privacyPolicyLink: string
    setPrivacyPolicyLink: React.Dispatch<React.SetStateAction<string>>
    preferredLanguage: string
    setPreferredLanguage: React.Dispatch<React.SetStateAction<string>>
    goal: string
    setGoal: React.Dispatch<React.SetStateAction<string>>
    companySegment: string
    setCompanySegment: React.Dispatch<React.SetStateAction<string>>
    locations: LocationData | undefined
    setLocations: React.Dispatch<React.SetStateAction<LocationData | undefined>>
    inputError: InputErrors
    setInputError: React.Dispatch<React.SetStateAction<InputErrors>>
    isAnalyzingWebsite: boolean
    setIsAnalyzingWebsite: React.Dispatch<React.SetStateAction<boolean>>
    websiteAnalysisComplete: boolean
    setWebsiteAnalysisComplete: React.Dispatch<React.SetStateAction<boolean>>
    websiteData: WebsiteAnalysisData
    setWebsiteData: React.Dispatch<React.SetStateAction<WebsiteAnalysisData>>
    foundPrivacyPolicy: string | null
    setFoundPrivacyPolicy: React.Dispatch<React.SetStateAction<string | null>>
    error: string | null
    setError: React.Dispatch<React.SetStateAction<string | null>>
    dbChangeRequested: boolean
    setDbChangeRequested: React.Dispatch<React.SetStateAction<boolean>>
    showSuccessMessage: boolean
    setShowSuccessMessage: React.Dispatch<React.SetStateAction<boolean>>
    isSaving: boolean
    setIsSaving: React.Dispatch<React.SetStateAction<boolean>>
    isMobile: boolean
    setIsMobile: React.Dispatch<React.SetStateAction<boolean>>
    dialogOpenedAt: number | null
    setDialogOpenedAt: React.Dispatch<React.SetStateAction<number | null>>
    handleNextStep: () => void
    handlePrevStep: () => void
    handleSave: () => Promise<void>
    handleClose: () => void
    handleAnalyzeWebsite: () => Promise<void>
    isValidUrl: (url: string) => boolean
    validateAndFixUrl: (url: string) => string
    isStepComplete: (step: { id: string, title: string, group: string, fields: string[] }) => boolean
    isAllFieldsFilled: () => boolean
    getFieldValue: (field: string) => string
    getFieldError: (field: string) => string | null
    userDetails: OnboardingProps['userDetails']
    updateOnboardingDetails: OnboardingProps['updateOnboardingDetails']
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ 
    children,
    userDetails,
    open,
    setOpen,
    updateOnboardingDetails
}: { children: React.ReactNode } & OnboardingProps) {
    const [error, setError] = useState<string | null>(null)
    const [inputError, setInputError] = useState<InputErrors>({
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

    // Website Analysis States
    const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState<boolean>(false)
    const [websiteAnalysisComplete, setWebsiteAnalysisComplete] = useState<boolean>(false)
    const [websiteData, setWebsiteData] = useState<WebsiteAnalysisData>(null)
    const [foundPrivacyPolicy, setFoundPrivacyPolicy] = useState<string | null>(null)
    
    const [firstName, setFirstName] = useState<string>(userDetails?.first_name || "")
    const [lastName, setLastName] = useState<string>(userDetails?.last_name || "")
    const [companyName, setCompanyName] = useState<string>(userDetails?.company_name || "")
    const [companyDescription, setCompanyDescription] = useState<string>(userDetails?.company_description || "")
    const [websiteLink, setWebsiteLink] = useState<string>(userDetails?.website_link || "")
    const [privacyPolicyLink, setPrivacyPolicyLink] = useState<string>(userDetails?.privacy_policy_link || "")
    const [preferredLanguage, setPreferredLanguage] = useState<string>(userDetails?.preferred_language || "en")
    const [goal, setGoal] = useState<string>(userDetails?.goal || "")
    const [companySegment, setCompanySegment] = useState<string>(userDetails?.company_segment || "")
    const [locations, setLocations] = useState<LocationData | undefined>(userDetails?.locations)

    const [dbChangeRequested, setDbChangeRequested] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [dialogOpenedAt, setDialogOpenedAt] = useState<number | null>(null)

    // Check if the device is mobile
    useEffect(() => {
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
    useEffect(() => {
        if (open) {
            setDialogOpenedAt(Date.now());
            
            // For our one-question-at-a-time flow, always start from the beginning
            // unless there's a different logic needed
            setCurrentStep(0);
        }
    }, [open]);
    
    // Update states only when userDetails changes AND the dialog is not open
    // This prevents reloading locations from database after user has deleted them
    useEffect(() => {
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

    useEffect(() => {
        setTimeout(() => {
            setShowSuccessMessage(false)
        }, 5000)
    }, [showSuccessMessage])

    // Check if a URL is valid (has a TLD after adding https://)
    const isValidUrl = (url: string) => {
        if (!url || url.trim() === '') return false;
        
        try {
            // Ensure URL has protocol before checking
            const urlWithProtocol = url.match(/^https?:\/\//i) ? url : `https://${url}`;
            const urlObj = new URL(urlWithProtocol);
            
            // Check for a valid domain with at least one dot (to ensure there's a TLD)
            return urlObj.hostname.includes('.') && urlObj.hostname.split('.').pop()!.length > 0;
        } catch (e) {
            return false;
        }
    };
    
    // URL validation to ensure all links have https:// but no www.
    const validateAndFixUrl = (url: string) => {
        if (!url || url.trim() === '') return url;
        
        // Remove www. if present
        let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)/i, '');
        
        // Add https:// if not present
        if (!cleanUrl.match(/^https?:\/\//i)) {
            return `https://${cleanUrl}`;
        }
        
        return cleanUrl;
    };

    // Check if a step is complete
    const isStepComplete = (step: { id: string, title: string, group: string, fields: string[] }) => {
        // Skip the confirmation step, which is always considered "incomplete" to ensure user action
        if (step.id === 'confirm') return false;
        
        // Special handling for website analysis step
        if (step.id === 'website_analysis') {
            // For initial setup, require website analysis
            const isInitialSetup = !userDetails?.defaultExtraDetails;
            
            // If this is not the initial setup, the website analysis step is optional
            if (!isInitialSetup) {
                // Just require a valid website URL for subsequent edits
                return websiteLink.trim() !== '' && isValidUrl(websiteLink);
            }
            
            // For initial setup, require both valid URL and completed analysis
            return websiteLink.trim() !== '' && isValidUrl(websiteLink) && websiteAnalysisComplete;
        }
        
        // For location step, check if at least one location is selected
        if (step.id === 'locations') {
            return locations !== undefined && Array.isArray(locations) && locations.length > 0;
        }
        
        // For all other steps, check that all required fields have values
        return step.fields.every(field => {
            const value = getFieldValue(field);
            // Make sure we can safely use trim by checking if it's a string
            return value !== undefined && (typeof value === 'string' ? value.trim() !== '' : !!value);
        });
    };

    // Check if all required fields across all steps are filled
    const isAllFieldsFilled = () => {
        // If there's already a userDetails.defaultExtraDetails, return true
        if (userDetails?.defaultExtraDetails) {
            return true;
        }
        
        // Check if all steps except company_description are complete
        // We're hiding the company_description step but still want to save its value
        return STEPS.slice(0, -1).every(step => {
            if (step.id === 'company_description') {
                // Always consider company_description complete for UI purposes
                return true;
            }
            return isStepComplete(step);
        });
    };

    // Validate the current step and move to the next if valid
    const validateStep = () => {
        // Skip validation for confirmation step
        if (currentStep >= STEPS.length - 1) return true;
        
        const currentStepId = STEPS[currentStep].id;
        
        // Skip validation for company_description step - we're hiding it in the UI
        if (currentStepId === 'company_description') {
            return true;
        }
        
        const currentFields = STEPS[currentStep].fields;
        const errors: InputErrors = { ...inputError };
        let hasErrors = false;
        
        console.log("Validating step:", currentStepId, "with fields:", currentFields);
        
        // Handle special case for locations step
        if (currentStepId === 'locations') {
            // Check if at least one location is selected
            if (!locations || locations.length === 0) {
                errors.locations = "Please select at least one location";
                setInputError(errors);
                return false;
            }
            return true;
        }
        
        // Handle special case for website analysis step
        if (currentStepId === 'website_analysis') {
            // Website link is always required
            if (!websiteLink || websiteLink.trim() === "") {
                errors.website_link = "Please enter a website URL";
                setInputError(errors);
                return false;
            }
            
            const fixedUrl = validateAndFixUrl(websiteLink);
            if (fixedUrl !== websiteLink) {
                setWebsiteLink(fixedUrl);
            }
            
            if (!isValidUrl(fixedUrl)) {
                errors.website_link = "Please enter a valid URL";
                setInputError(errors);
                return false;
            }
            
            // Check if this is initial setup or a return visit
            const isInitialSetup = !userDetails?.defaultExtraDetails;
            
            // For initial setup, website analysis is mandatory
            if (isInitialSetup) {
                // If analysis is not in progress or completed, start it
                if (!websiteAnalysisComplete && !isAnalyzingWebsite) {
                    // Start the analysis when user clicks Next
                    handleAnalyzeWebsite();
                    return false; // Stop navigation until analysis completes
                }
                
                // Only allow proceeding when analysis is complete
                return websiteAnalysisComplete;
            } else {
                // For return visits, analysis is optional - can proceed with just a valid URL
                return true;
            }
        }
        
        // Match field ID with value directly
        if (currentStepId === 'first_name') {
            if (!firstName || firstName.trim() === "") {
                errors.first_name = "Please enter your first name";
                hasErrors = true;
            } else {
                errors.first_name = "";
            }
        } 
        else if (currentStepId === 'last_name') {
            if (!lastName || lastName.trim() === "") {
                errors.last_name = "Please enter your last name";
                hasErrors = true;
            } else {
                errors.last_name = "";
            }
        } 
        else if (currentStepId === 'company_name') {
            if (!companyName || companyName.trim() === "") {
                errors.company_name = "Please enter your company name";
                hasErrors = true;
            } else {
                errors.company_name = "";
            }
        } 
        else if (currentStepId === 'company_description') {
            if (!companyDescription || (typeof companyDescription === 'string' && companyDescription.trim() === "")) {
                errors.company_description = "Please enter a company description";
                hasErrors = true;
            } else {
                errors.company_description = "";
            }
        } 
        else if (currentStepId === 'privacy_policy') {
            if (privacyPolicyLink && privacyPolicyLink.trim() !== "") {
                const fixedUrl = validateAndFixUrl(privacyPolicyLink);
                if (fixedUrl !== privacyPolicyLink) {
                    setPrivacyPolicyLink(fixedUrl);
                }
                
                if (!isValidUrl(fixedUrl)) {
                    errors.privacy_policy_link = "Please enter a valid URL";
                    hasErrors = true;
                } else {
                    errors.privacy_policy_link = "";
                }
            } else {
                // Privacy policy can be optional in some cases
                errors.privacy_policy_link = "";
            }
        } 
        else if (currentStepId === 'preferred_language') {
            if (!preferredLanguage || preferredLanguage.trim() === "") {
                errors.preferred_language = "Please select a language";
                hasErrors = true;
            } else {
                errors.preferred_language = "";
            }
        } 
        else if (currentStepId === 'company_type') {
            if (!companySegment || companySegment.trim() === "") {
                errors.company_segment = "Please select a company type";
                hasErrors = true;
            } else {
                errors.company_segment = "";
            }
        }
        
        setInputError(errors);
        return !hasErrors;
    };

    const handleNextStep = () => {
        if (validateStep()) {
            // Calculate the next step, checking for company_description to skip
            let nextStep = currentStep + 1;
            
            // Skip company_description step (which is index 5 in STEPS)
            // Check both by index and by id to be safe
            if (nextStep === 5 || STEPS[nextStep]?.id === 'company_description') {
                nextStep++;
            }
            
            // Ensure we don't go past the last step
            nextStep = Math.min(nextStep, STEPS.length - 1);
            
            console.log("Moving from step", currentStep, "to step", nextStep);
            
            setCurrentStep(nextStep);
            
            // Scroll to top when changing steps on mobile
            if (isMobile) {
                window.scrollTo(0, 0);
            }
        }
    };

    const handlePrevStep = () => {
        // Calculate the previous step, checking for company_description to skip
        let prevStep = currentStep - 1;
        
        // Skip company_description step when going backwards too
        if (prevStep === 5 || STEPS[prevStep]?.id === 'company_description') {
            prevStep--;
        }
        
        // Ensure we don't go before the first step
        prevStep = Math.max(prevStep, 0);
        
        console.log("Moving from step", currentStep, "to step", prevStep);
        
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
            
            // If somehow locations is empty at this point, set a default for USA
            let saveLocations = locations;
            if (!saveLocations || saveLocations.length === 0) {
                saveLocations = [{
                    country: {
                        name: "United States",
                        code: "US"
                    },
                    regions: []
                }];
                console.log("[TEMPORARY DEBUG] Using default USA location:", saveLocations);
            }
            
            // Ensure we have a company description, even if the step is hidden
            let saveCompanyDescription = companyDescription;
            if (!saveCompanyDescription || (typeof saveCompanyDescription === 'string' && saveCompanyDescription.trim() === "")) {
                saveCompanyDescription = "Company description automatically generated from website analysis.";
                console.log("[TEMPORARY DEBUG] Using default company description");
            }
            
            const details = {
                first_name: firstName,
                last_name: lastName,
                company_name: companyName,
                company_description: saveCompanyDescription, // Use the possibly defaulted description
                website_link: validateAndFixUrl(websiteLink),
                privacy_policy_link: validateAndFixUrl(privacyPolicyLink),
                preferred_language: preferredLanguage,
                goal: goal,
                company_segment: companySegment,
                locations: saveLocations
            }

            // Manually set goal since it's removed from the form
            details.goal = "";

            // Validate required fields before saving
            // Note: we're still requiring company_description but not showing it in the UI
            const requiredFields = [
                'first_name', 'last_name', 'company_name', 
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
                
                // Special handling for company_description - we still include it in save but don't validate it in the UI
                if (field === 'company_description') {
                    errors[field as keyof InputErrors] = "";
                } else if (!value || value.trim() === "") {
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
        // Only allow closing if all fields are filled
        if (!isAllFieldsFilled()) {
            setError("Please complete your profile setup to proceed.")
            return;
        }
        
        setOpen(false)
        // Reset loading state when dialog is closed
        setIsSaving(false)
    }

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
const getFieldError = (field: string): string | null => {
    const error = inputError[field as keyof InputErrors];
    return error !== undefined ? error : null;
};

    // Function to analyze website and extract data
    const handleAnalyzeWebsite = async () => {
        // Validate website URL first
        if (!websiteLink || websiteLink.trim() === "") {
            setInputError({...inputError, website_link: "Please enter a website URL"});
            return;
        }

        try {
            // Normalize and fix URL if needed
            const fixedUrl = validateAndFixUrl(websiteLink);
            if (fixedUrl !== websiteLink) {
                setWebsiteLink(fixedUrl);
            }
            
            if (!isValidUrl(fixedUrl)) {
                setInputError({...inputError, website_link: "Please enter a valid URL"});
                return;
            }
            
            // Clear previous results and set loading state
            setError(null);
            setIsAnalyzingWebsite(true);
            setWebsiteData(null);
            setWebsiteAnalysisComplete(false);
            
            // Make the request to the website-scrape endpoint
            const response = await fetch("/api/website-scrape", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: fixedUrl }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to analyze website");
            }
            
            const data = await response.json();
            
            console.log("Website analysis data received:", data);
            
            // Update state with the results
            setWebsiteData({
                colors: data.colors || [],
                fonts: data.fonts || [],
                contentSample: data.contentSample || "",
                contentSummary: data.contentSummary || "",
                images: data.images || []
            });
            
            // Store the found privacy policy link but don't auto-fill it
            if (data.privacyPolicyUrl) {
                console.log("Found privacy policy (not auto-filling):", data.privacyPolicyUrl);
                setFoundPrivacyPolicy(data.privacyPolicyUrl);
                // Removed auto-fill: setPrivacyPolicyLink(data.privacyPolicyUrl);
            }
            
            // Set detected language if available
            if (data.language) {
                console.log("Auto-filling language:", data.language);
                setPreferredLanguage(data.language);
            }
            
            // Auto-fill company name if available and not already set
            if (data.companyName && (!companyName || companyName.trim() === "")) {
                console.log("Auto-filling company name:", data.companyName);
                setCompanyName(data.companyName);
            }
            
            // Auto-fill company description from several possible sources
            // Check the specific companyDescription field first
            if (data.companyDescription && (!companyDescription || typeof companyDescription !== 'string' || companyDescription.trim() === "")) {
                console.log("Auto-filling company description from companyDescription field:", data.companyDescription);
                setCompanyDescription(data.companyDescription);
            } 
            // Try plainBrandOverview next (used in some versions of the API)
            else if (data.plainBrandOverview && (!companyDescription || typeof companyDescription !== 'string' || companyDescription.trim() === "")) {
                console.log("Auto-filling company description from plainBrandOverview field:", data.plainBrandOverview);
                setCompanyDescription(data.plainBrandOverview);
            }
            // Try contentSummary as a last resort
            else if (data.contentSummary && (!companyDescription || typeof companyDescription !== 'string' || companyDescription.trim() === "")) {
                console.log("Auto-filling company description from contentSummary field:", data.contentSummary);
                setCompanyDescription(data.contentSummary);
            } else {
                console.log("Not auto-filling company description:", {
                    hasCompanyDescription: !!data.companyDescription,
                    hasPlainBrandOverview: !!data.plainBrandOverview,
                    hasContentSummary: !!data.contentSummary,
                    currentDesc: companyDescription
                });
            }
            
            // Mark analysis as complete
            setWebsiteAnalysisComplete(true);
            setIsAnalyzingWebsite(false);
            
        } catch (error) {
            console.error("Error analyzing website:", error);
            setError(error instanceof Error ? error.message : "Failed to analyze website");
            setIsAnalyzingWebsite(false);
        }
    };

    const value = {
        currentStep,
        setCurrentStep,
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
        goal,
        setGoal,
        companySegment,
        setCompanySegment,
        locations,
        setLocations,
        inputError,
        setInputError,
        isAnalyzingWebsite,
        setIsAnalyzingWebsite,
        websiteAnalysisComplete,
        setWebsiteAnalysisComplete,
        websiteData,
        setWebsiteData,
        foundPrivacyPolicy,
        setFoundPrivacyPolicy,
        error,
        setError,
        dbChangeRequested,
        setDbChangeRequested,
        showSuccessMessage,
        setShowSuccessMessage,
        isSaving,
        setIsSaving,
        isMobile,
        setIsMobile,
        dialogOpenedAt,
        setDialogOpenedAt,
        handleNextStep,
        handlePrevStep,
        handleSave,
        handleClose,
        handleAnalyzeWebsite,
        isValidUrl,
        validateAndFixUrl,
        isStepComplete,
        isAllFieldsFilled,
        getFieldValue,
        getFieldError,
        userDetails,
        updateOnboardingDetails,
        open,
        setOpen
    }

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
}