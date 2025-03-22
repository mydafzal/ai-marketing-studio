export const STRIPE_LOOKUP_KEYS = {
    MONTHLY: {
      CONTENT: 'reeply_content_monthly',
      MARKETING: 'reeply_marketing_monthly'
    },
    YEARLY: {
      CONTENT: 'reeply_content_yearly',
      MARKETING: 'reeply_marketing_yearly'
    }
  } as const
  
  export function getLookupKeyByTag(tag: string): string | undefined {
    const flattened = {
      monthly_content: STRIPE_LOOKUP_KEYS.MONTHLY.CONTENT,
      monthly_marketing: STRIPE_LOOKUP_KEYS.MONTHLY.MARKETING,
      yearly_content: STRIPE_LOOKUP_KEYS.YEARLY.CONTENT,
      yearly_marketing: STRIPE_LOOKUP_KEYS.YEARLY.MARKETING
    }
    return flattened[tag.toLowerCase() as keyof typeof flattened]
  }
  