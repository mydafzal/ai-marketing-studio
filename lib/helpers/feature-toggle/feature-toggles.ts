// lib/helpers/feature-toggle/feature-toggles.ts

export interface FeatureToggle {
    name: string;
    description: string;
}

export const featureToggles: FeatureToggle[] = [
    {
        name: "demoToggle",
        description: "For checking feature toggle functionality on demo page (feature toggle health check)"
    },
    {
        name: "adminFeatures",
        description: "For enabling admin features such as removing chat history!"
    },
    {
        name: "AddFbToLoginPage",
        description: "Adds login with facebook to login page"
    },
    {
        name: "enforceUserApiKey",
        description: "Enforce user to link their own facebook account"
    },
    {
        name: "userGuideFloatingButton",
        description: "Show the floating button 'Things to ask Reeply AI' on the chat panel"
    }
    // Add more feature toggles as needed
];

// Toggles to add in the future:
// LoggingToggle - for enabling better logging
