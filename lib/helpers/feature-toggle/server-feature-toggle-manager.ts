import {cookies} from 'next/headers';

export function isEnabled(featureToggleName: string): boolean {
    const cookieStore = cookies();
    return cookieStore.get(featureToggleName)?.value === 'true';
}

export function setFeatureToggle(featureToggleName: string, isEnabled: boolean) {
    cookies().set(featureToggleName, isEnabled.toString(), {
        path: '/',
        httpOnly: false, // Change to false so it's accessible by client-side JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}