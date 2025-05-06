/**
 * Stripe pricing configuration
 * Contains lookup keys and pricing information for all subscription plans
 */

export interface StripePriceConfig {
  lookupKey: string;
  sandbox_lookupKey: string;
  pricePerMonth: number;
  currency: string;
  name: string;
  features: string[];
  hidden: boolean;
}

const stripePriceConfig = {
  monthly: {
    pro: {
      lookupKey: 'reeply_marketing_monthly_apr2025',
      sandbox_lookupKey: 'reeply_marketing_monthly_test',
      pricePerMonth: 99,
      currency: '€',
      name: 'AI Marketer Suite',
      hidden: false,
      features: [
        'Campaign creation from scratch',
        'Conversational campaign management',
        'Meta Ad Campaign analysis',
        'AI campaign recommendations',
        'Ad creative generation',
        'Image editing with AI brushing',
        'Generate 5-10 second video scenes',
        'Product angle shots',
      ]
    }
  },
  yearly: {
    pro: {
      lookupKey: 'reeply_marketing_yearly_apr2025',
      sandbox_lookupKey: 'reeply_marketing_yearly_test',
      pricePerMonth: 83.25,
      currency: '€',
      name: 'AI Marketer Suite',
      hidden: false,
      features: [
        'Campaign creation from scratch',
        'Conversational campaign management',
        'Meta Ad Campaign analysis',
        'AI campaign recommendations',
        'Ad creative generation',
        'Image editing with AI brushing',
        'Generate 5-10 second video scenes',
        'Product angle shots'
      ]
    }
  }
};

/**
 * Determines the appropriate lookup key based on the environment
 * @param planConfig The plan configuration object
 * @returns The correct lookup key for the current environment
 */
export function getLookupKey(planConfig: StripePriceConfig): string {
  const isDevelopment = 
    typeof process !== 'undefined' && 
    process.env.NODE_ENV === 'development';
  
  return isDevelopment ? planConfig.sandbox_lookupKey : planConfig.lookupKey;
}

export default stripePriceConfig;