import { LocationData } from '../onboarding-location-selector'
import { User } from '@/lib/types'

export type Details = {
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

export type InputErrors = {
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

export type OnboardingProps = {
    userDetails: User | undefined
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
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

export type WebsiteAnalysisData = {
    colors: string[];
    fonts: string[];
    contentSample: string;
    contentSummary: string;
    images: string[];
} | null

export const GOAL_OPTIONS = {
    GENERATE_LEADS: "I want to generate more leads",
    RECRUIT_EMPLOYEES: "I want to recruit employees",
    INCREASE_CONVERSIONS: "I want to increase conversions",
} as const;

export const SEGMENT_OPTIONS = {
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
export const STEPS = [
    { 
        id: 'first_name', 
        title: 'First Name', 
        group: 'Personal Information',
        fields: ['first_name'] 
    },
    { 
        id: 'last_name', 
        title: 'Last Name', 
        group: 'Personal Information',
        fields: ['last_name'] 
    },
    { 
        id: 'company_name', 
        title: 'Company Name', 
        group: 'Personal Information',
        fields: ['company_name'] 
    },
    { 
        id: 'website_analysis', 
        title: 'Website Analysis', 
        group: 'Website',
        fields: ['website_link'] 
    },
    { 
        id: 'company_type', 
        title: 'Company Type', 
        group: 'Company',
        fields: ['company_segment'] 
    },
    { 
        id: 'company_description', 
        title: 'Company Description', 
        group: 'Company',
        fields: ['company_description'] 
    },
    { 
        id: 'privacy_policy', 
        title: 'Privacy Policy', 
        group: 'Website',
        fields: ['privacy_policy_link'] 
    },
    { 
        id: 'preferred_language', 
        title: 'Preferred Language', 
        group: 'Preferences',
        fields: ['preferred_language'] 
    },
    { 
        id: 'locations', 
        title: 'Preferred Locations', 
        group: 'Preferences',
        fields: ['locations'] 
    },
    { 
        id: 'confirm', 
        title: 'Confirm & Save', 
        group: 'Completion',
        fields: [] 
    },
];
