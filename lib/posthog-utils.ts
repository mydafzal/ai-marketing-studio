// lib/posthog-utils.ts
const INTERNAL_EMAILS = ['@reeply.ai', '@reeply.net']

export function isInternalUser(email?: string): boolean {
    if (email === 'vinayak@reeply.ai') return false; // this account is used for fb verification so tracking should be enabled on it
    if (!email) return false
    return INTERNAL_EMAILS.some((domain) => email.toLowerCase().includes(domain))
}
