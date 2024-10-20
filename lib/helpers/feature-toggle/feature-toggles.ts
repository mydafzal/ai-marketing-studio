// lib/helpers/feature-toggle/feature-toggles.ts

export interface FeatureToggle {
    name: string;
    description: string;
}

export const featureToggles: FeatureToggle[] = [
    {
        name: "demoToggle",
        description: "For checking feature toggle functionality on demo page (TODO)"
    },
    {
        name: "loggingToggle",
        description: "For enabling logging feature (TODO)"
    },
    {
        name: "adminFeatures",
        description: "For enabling admin features such as removing chat history!"
    },
    {
        name: "onboardingFeatures",
        description: "Enable onboarding pop-up and enforce if FbAccountId is missing"
    },
    {
        name: "enforceUserApiKey",
        description: "Enforce user to link their own facebook account (Go live after 'onboardingFeatures')"
    }
    // Add more feature toggles as needed
];