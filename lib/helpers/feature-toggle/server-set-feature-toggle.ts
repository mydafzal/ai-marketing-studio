// server-set-feature-toggle.ts

import { cookies } from 'next/headers';

export function setFeatureToggle(featureToggleName: string, isEnabled: boolean) {
    cookies().set(featureToggleName, isEnabled.toString(), {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
}