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
    basic: {
      lookupKey: 'reeply_marketing_basic_monthly_june2025_taxauto',
      sandbox_lookupKey: 'reeply_marketing_basic_monthly_test',
      pricePerMonth: 99,
      currency: '€',
      name: 'AI Marketer Suite Basic',
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
        'Standard support via chat'
      ]
    },
    standard: {
      lookupKey: 'reeply_marketing_standard_monthly_june2025_taxauto',
      sandbox_lookupKey: 'reeply_marketing_standard_monthly_test',
      pricePerMonth: 299,
      currency: '€',
      name: 'AI Marketer Suite Standard',
      hidden: false,
      features: [
        'All Basic features',
        'Premium support with priority response',
        'Training sessions included'
      ]
    },
    pro: {
      lookupKey: 'reeply_marketing_pro_monthly_june2025_taxauto',
      sandbox_lookupKey: 'reeply_marketing_pro_monthly_test',
      pricePerMonth: 599,
      currency: '€',
      name: 'AI Marketer Suite Pro',
      hidden: false,
      features: [
        'All Standard features',
        'Dedicated account manager',
        'Tailored for larger organizations'
      ]
    }
  },
  yearly: {
    basic: {
      lookupKey: 'reeply_marketing_basic_yearly_apr2025',
      sandbox_lookupKey: 'reeply_marketing_basic_yearly_test',
      pricePerMonth: 83.25,
      currency: '€',
      name: 'AI Marketer Suite Basic',
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
        'Standard support via chat'
      ]
    },
    standard: {
      lookupKey: 'reeply_marketing_standard_yearly_apr2025',
      sandbox_lookupKey: 'reeply_marketing_standard_yearly_test',
      pricePerMonth: 249,
      currency: '€',
      name: 'AI Marketer Suite Standard',
      hidden: false,
      features: [
        'All Basic features',
        'Premium support with priority response',
        'Training sessions included',
        'Advanced campaign optimization',
        'Custom ad creative templates',
        'Weekly performance reports',
        'Multi-user access (up to 3 users)',
        'Extended video generation (up to 30 seconds)'
      ]
    },
    pro: {
      lookupKey: 'reeply_marketing_pro_yearly_apr2025',
      sandbox_lookupKey: 'reeply_marketing_pro_yearly_test',
      pricePerMonth: 499,
      currency: '€',
      name: 'AI Marketer Suite Pro',
      hidden: false,
      features: [
        'All Standard features',
        'Dedicated account manager',
        'Tailored for larger organizations',
        'Custom AI training for your brand',
        'Unlimited multi-user access',
        'API access for custom integrations',
        'Advanced analytics dashboard',
        'White-labeled reports',
        'Quarterly strategy consultations'
      ]
    }
  }
}

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