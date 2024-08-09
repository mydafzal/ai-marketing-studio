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
        description: "For enabling admin features such as creating new chats, deleting chats etc.x"
    }
    // Add more feature toggles as needed
];