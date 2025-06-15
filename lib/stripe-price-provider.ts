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
        'Up to 50 ad creatives included',
        'Up to 10 new campaigns per month',
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
        'Up to 200 ad creatives included',
        'Up to 50 new campaigns per month',
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
        'Up to 750 ad creatives included',
        'Unlimited new campaigns',
        'Dedicated account manager',
        'Tailored for larger organizations'
      ]
    }
  },
  '3-month': {
    basic: {
      lookupKey: 'reeply_marketing_basic_3month_june2025_taxauto',
      sandbox_lookupKey: 'reeply_marketing_basic_3month_test',
      pricePerMonth: 94, // 5% discount
      currency: '€',
      name: 'AI Marketer Suite Basic',
      hidden: false,
      features: [
        'Campaign creation from scratch',
        'Conversational campaign management',
        'Meta Ad Campaign analysis',
        'AI campaign recommendations',
        'Ad creative generation',
        'Up to 50 ad creatives included',
        'Up to 10 new campaigns per month',
        'Image editing with AI brushing',
        'Generate 5-10 second video scenes',
        'Product angle shots',
        'Standard support via chat',
        '5% discount compared to monthly'
      ]
    },
    standard: {
      lookupKey: 'reeply_marketing_standard_3month_june2025_taxauto_fix',
      sandbox_lookupKey: 'reeply_marketing_standard_3month_test',
      pricePerMonth: 284, // 5% discount
      currency: '€',
      name: 'AI Marketer Suite Standard',
      hidden: false,
      features: [
        'All Basic features',
        'Up to 200 ad creatives included',
        'Up to 50 new campaigns per month',
        'Premium support with priority response',
        'Training sessions included',
        '5% discount compared to monthly'
      ]
    },
    pro: {
      lookupKey: 'reeply_marketing_pro_3month_june2025_taxauto_fix',
      sandbox_lookupKey: 'reeply_marketing_pro_3month_test',
      pricePerMonth: 569, // 5% discount
      currency: '€',
      name: 'AI Marketer Suite Pro',
      hidden: false,
      features: [
        'All Standard features',
        'Up to 750 ad creatives included',
        'Unlimited new campaigns',
        'Dedicated account manager',
        'Tailored for larger organizations',
        '5% discount compared to monthly'
      ]
    }
  },
  '6-month': {
    basic: {
      lookupKey: 'reeply_marketing_basic_6month_june2025_taxauto',
      sandbox_lookupKey: 'reeply_marketing_basic_6month_test',
      pricePerMonth: 89, // 10% discount
      currency: '€',
      name: 'AI Marketer Suite Basic',
      hidden: false,
      features: [
        'Campaign creation from scratch',
        'Conversational campaign management',
        'Meta Ad Campaign analysis',
        'AI campaign recommendations',
        'Ad creative generation',
        'Up to 50 ad creatives included',
        'Up to 10 new campaigns per month',
        'Image editing with AI brushing',
        'Generate 5-10 second video scenes',
        'Product angle shots',
        'Standard support via chat',
        '10% discount compared to monthly'
      ]
    },
    standard: {
      lookupKey: 'reeply_marketing_standard_6month_june2025_taxauto_2',
      sandbox_lookupKey: 'reeply_marketing_standard_6month_test',
      pricePerMonth: 269, // 10% discount
      currency: '€',
      name: 'AI Marketer Suite Standard',
      hidden: false,
      features: [
        'All Basic features',
        'Up to 200 ad creatives included',
        'Up to 50 new campaigns per month',
        'Premium support with priority response',
        'Training sessions included',
        '10% discount compared to monthly'
      ]
    },
    pro: {
      lookupKey: 'reeply_marketing_pro_6month_june2025_taxauto_fix',
      sandbox_lookupKey: 'reeply_marketing_pro_6month_test',
      pricePerMonth: 539, // 10% discount
      currency: '€',
      name: 'AI Marketer Suite Pro',
      hidden: false,
      features: [
        'All Standard features',
        'Up to 750 ad creatives included',
        'Unlimited new campaigns',
        'Dedicated account manager',
        'Tailored for larger organizations',
        '10% discount compared to monthly'
      ]
    }
  },
  yearly: {
    basic: {
      lookupKey: 'reeply_marketing_basic_yearly_june2025_taxauto',
      sandbox_lookupKey: 'reeply_marketing_basic_yearly_test',
      pricePerMonth: 84.15, // 15% discount
      currency: '€',
      name: 'AI Marketer Suite Basic',
      hidden: false,
      features: [
        'Campaign creation from scratch',
        'Conversational campaign management',
        'Meta Ad Campaign analysis',
        'AI campaign recommendations',
        'Ad creative generation',
        'Up to 50 ad creatives included',
        'Up to 10 new campaigns per month',
        'Image editing with AI brushing',
        'Generate 5-10 second video scenes',
        'Product angle shots',
        'Standard support via chat',
        '15% discount compared to monthly'
      ]
    },
    standard: {
      lookupKey: 'reeply_marketing_standard_yearly_june2025_taxauto_fix',
      sandbox_lookupKey: 'reeply_marketing_standard_yearly_test',
      pricePerMonth: 254.15, // 15% discount
      currency: '€',
      name: 'AI Marketer Suite Standard',
      hidden: false,
      features: [
        'All Basic features',
        'Up to 200 ad creatives included',
        'Up to 50 new campaigns per month',
        'Premium support with priority response',
        'Training sessions included',
        '15% discount compared to monthly'
      ]
    },
    pro: {
      lookupKey: 'reeply_marketing_pro_yearly_june2025_taxauto_fix',
      sandbox_lookupKey: 'reeply_marketing_pro_yearly_test',
      pricePerMonth: 509.15, // 15% discount
      currency: '€',
      name: 'AI Marketer Suite Pro',
      hidden: false,
      features: [
        'All Standard features',
        'Up to 750 ad creatives included',
        'Unlimited new campaigns',
        'Dedicated account manager',
        'Tailored for larger organizations',
        '15% discount compared to monthly'
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