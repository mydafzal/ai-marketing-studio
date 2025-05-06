/**
 * Stripe pricing configuration
 * Contains lookup keys and pricing information for all subscription plans
 */

export interface StripePriceConfig {
  lookupKey: string;
  pricePerMonth: number;
  currency: string;
  name: string;
  features: string[];
  hidden: boolean;
}

const stripePriceConfig = {
  monthly: {
    pro: {
      lookupKey: 'reeply_marketing_monthly',
      pricePerMonth: 99,
      currency: 'EUR',
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
      lookupKey: 'reeply_marketing_yearly',
      pricePerMonth: 71.96,
      currency: 'EUR',
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

export default stripePriceConfig;