// lib/posthog-utils.ts
const INTERNAL_EMAILS = ['@reeply.ai', '@reeply.net']

export function isInternalUser(email?: string): boolean {
    if (email === 'vinayak@reeply.ai') return false;
    if (!email) return false
    return INTERNAL_EMAILS.some((domain) => email.toLowerCase().includes(domain))
}
