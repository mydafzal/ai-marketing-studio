// utils/getBaseUrl.ts

export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        // Client-side
        if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
            return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
        } else if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
            return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`;
        } else {
            return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
        }
    } else {
        // Server-side
        if (process.env.VERCEL_ENV === 'production') {
            return `https://${process.env.VERCEL_URL}`;
        } else if (process.env.VERCEL_ENV === 'preview') {
            return `https://${process.env.VERCEL_URL}`;
        } else {
            return 'http://localhost:3000'; // Default for local development server
        }
    }
}
