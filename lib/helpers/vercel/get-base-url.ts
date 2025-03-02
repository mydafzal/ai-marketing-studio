// utils/getBaseUrl.ts

export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        // Client-side
        if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
            const url = `${process.env.NEXT_PUBLIC_PRODUCTION_URL}`;
            console.log('Client-side Production URL:', url);
            return url;
        } else if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
            const url = `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`;
            console.log('Client-side Preview URL:', url);
            return url;
        } else {
            const url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
            console.log('Client-side Development URL:', url);
            return url;
        }
    } else {
        // Server-side
        if (process.env.VERCEL_ENV === 'production') {
            const url = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
            console.log('Server-side Production URL:', url);
            return url;
        } else if (process.env.VERCEL_ENV === 'preview') {
            const url = `https://${process.env.VERCEL_URL}`;
            console.log('Server-side Preview URL:', url);
            return url;
        } else {
            const url = 'http://localhost:3000';
            console.log('Server-side Development URL:', url);
            return url;
        }
    }
}
