// feature-toggle-manager.ts

function isClientSide(): boolean {
    return typeof window !== 'undefined';
}

export function isFeatureToggleEnabled(featureToggleName: string): boolean {
    if (isClientSide()) {
        // Client-side logic
        const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${featureToggleName}=`))
            ?.split('=')[1];
        return value === 'true';
    } else {
        // Server-side logic
        const { cookies } = require('next/headers');
        const cookieStore = cookies();
        return cookieStore.get(featureToggleName)?.value === 'true';
    }
}