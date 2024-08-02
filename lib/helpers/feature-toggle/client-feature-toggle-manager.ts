'use client';

export function isEnabled(featureToggleName: string): boolean {
    const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${featureToggleName}=`))
        ?.split('=')[1];
    return value === 'true';
}