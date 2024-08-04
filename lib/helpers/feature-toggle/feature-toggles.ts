// lib/helpers/feature-toggle/feature-toggles.ts

export interface FeatureToggle {
    name: string;
    description: string;
}

export const featureToggles: FeatureToggle[] = [
    {
        name: "demoToggle",
        description: "For checking feature toggle functionality on demo page (todo)"
    },
    {
        name: "loggingToggle",
        description: "For enabling logging feature (todo)"
    }
    // Add more feature toggles as needed
];