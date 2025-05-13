import { Campaign, DailyCreative } from './types';

// Example campaign data
export const allCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'Campaign A',
    thumbnail: 'https://i.imgur.com/Ojnc0UD.png',
    status: 'ACTIVE',
    budget: 1200,
    startDate: '2023-12-01',
    endDate: '2024-01-15',
    metrics: {
      ctr: '2.7%',
      conversions: 138,
      cpa: '$24.50',
      clicks: 5125,
      impressions: 189815,
      spend: '$3,381.00',
      leads: 76
    },
    performance: {
      ctr: 70,
      conversions: 80,
      cpa: 65
    },
    adSets: [
      { id: 101, name: 'Interest Targeting', status: 'ACTIVE', budget: 600, impressions: 95420, clicks: 2578 },
      { id: 102, name: 'Lookalike Audience', status: 'ACTIVE', budget: 600, impressions: 94395, clicks: 2547 }
    ],
    creatives: [
      { id: 201, name: 'Blue Banner', status: 'ACTIVE', impressions: 94908, clicks: 2562, ctr: '2.7%' },
      { id: 202, name: 'Product Showcase', status: 'ACTIVE', impressions: 94907, clicks: 2563, ctr: '2.7%' }
    ]
  },
  {
    id: 2,
    name: 'Campaign B',
    thumbnail: 'https://i.imgur.com/RV46pAm.png',
    status: 'PAUSED',
    budget: 800,
    startDate: '2023-11-15',
    endDate: '2023-12-31',
    metrics: {
      ctr: '1.9%',
      conversions: 82,
      cpa: '$31.20',
      clicks: 3280,
      impressions: 172632,
      spend: '$2,558.40',
      leads: 42
    },
    performance: {
      ctr: 50,
      conversions: 45,
      cpa: 40
    },
    adSets: [
      { id: 103, name: 'Broad Targeting', status: 'PAUSED', budget: 400, impressions: 85000, clicks: 1615 },
      { id: 104, name: 'Retargeting', status: 'PAUSED', budget: 400, impressions: 87632, clicks: 1665 }
    ],
    creatives: [
      { id: 203, name: 'Product Demo', status: 'PAUSED', impressions: 86316, clicks: 1640, ctr: '1.9%' },
      { id: 204, name: 'Customer Testimonial', status: 'PAUSED', impressions: 86316, clicks: 1640, ctr: '1.9%' }
    ]
  },
  {
    id: 3,
    name: 'Campaign C',
    thumbnail: 'https://i.imgur.com/mPyghQL.png',
    status: 'ACTIVE',
    budget: 1500,
    startDate: '2023-12-15',
    endDate: '2024-02-15',
    metrics: {
      ctr: '3.2%',
      conversions: 215,
      cpa: '$18.75',
      clicks: 6720,
      impressions: 210000,
      spend: '$4,031.25',
      leads: 125
    },
    performance: {
      ctr: 85,
      conversions: 95,
      cpa: 80
    },
    adSets: [
      { id: 105, name: 'Core Audience', status: 'ACTIVE', budget: 750, impressions: 105000, clicks: 3360 },
      { id: 106, name: 'Custom Audience', status: 'ACTIVE', budget: 750, impressions: 105000, clicks: 3360 }
    ],
    creatives: [
      { id: 205, name: 'Feature Highlight', status: 'ACTIVE', impressions: 70000, clicks: 2240, ctr: '3.2%' },
      { id: 206, name: 'Value Proposition', status: 'ACTIVE', impressions: 70000, clicks: 2240, ctr: '3.2%' },
      { id: 207, name: 'Limited Offer', status: 'ACTIVE', impressions: 70000, clicks: 2240, ctr: '3.2%' }
    ]
  },
  {
    id: 4,
    name: 'Campaign D',
    thumbnail: 'https://i.imgur.com/m980mEj.png',
    status: 'ACTIVE',
    budget: 1350,
    startDate: '2024-01-01',
    endDate: '2024-02-28',
    metrics: {
      ctr: '2.5%',
      conversions: 176,
      cpa: '$22.30',
      clicks: 5280,
      impressions: 211200,
      spend: '$3,924.80',
      leads: 92
    },
    performance: {
      ctr: 65,
      conversions: 85,
      cpa: 70
    },
    adSets: [
      { id: 107, name: 'Geographic Targeting', status: 'ACTIVE', budget: 675, impressions: 105600, clicks: 2640 },
      { id: 108, name: 'Demographic Targeting', status: 'ACTIVE', budget: 675, impressions: 105600, clicks: 2640 }
    ],
    creatives: [
      { id: 208, name: 'Main Banner', status: 'ACTIVE', impressions: 70400, clicks: 1760, ctr: '2.5%' },
      { id: 209, name: 'Secondary Banner', status: 'ACTIVE', impressions: 70400, clicks: 1760, ctr: '2.5%' },
      { id: 210, name: 'Video Ad', status: 'ACTIVE', impressions: 70400, clicks: 1760, ctr: '2.5%' }
    ]
  },
  {
    id: 5,
    name: 'Summer Sale Campaign',
    thumbnail: 'https://i.imgur.com/Ojnc0UD.png',
    status: 'ACTIVE',
    metrics: {
      ctr: '3.1%',
      conversions: 192,
      cpa: '$21.70'
    },
    performance: {
      ctr: 75,
      conversions: 90,
      cpa: 72
    }
  },
  {
    id: 6,
    name: 'Holiday Promotion',
    thumbnail: 'https://i.imgur.com/RV46pAm.png',
    status: 'PAUSED',
    metrics: {
      ctr: '2.3%',
      conversions: 165,
      cpa: '$25.80'
    },
    performance: {
      ctr: 60,
      conversions: 75,
      cpa: 55
    }
  },
  {
    id: 7,
    name: 'Brand Awareness',
    thumbnail: 'https://i.imgur.com/mPyghQL.png',
    status: 'ACTIVE',
    metrics: {
      ctr: '2.9%',
      conversions: 205,
      cpa: '$19.90'
    },
    performance: {
      ctr: 72,
      conversions: 92,
      cpa: 77
    }
  }
];

// Example daily creatives data
export const dailyCreatives: DailyCreative[] = [
  {
    id: 1,
    imageUrl: 'https://i.imgur.com/W1GwjpZ.jpeg',
    prompt: 'A modern minimalist logo for a tech startup with blue and teal colors, digital theme',
    title: 'Tech Startup Logo'
  },
  {
    id: 2,
    imageUrl: 'https://i.imgur.com/7JVLczg.jpeg',
    prompt: 'Professional business woman in a modern office setting with city view, discussing marketing strategy',
    title: 'Business Professional'
  },
  {
    id: 3,
    imageUrl: 'https://i.imgur.com/yzsypIu.jpeg',
    prompt: 'Product showcase of a premium smartphone with dark background and blue accent lighting',
    title: 'Product Showcase'
  },
  {
    id: 4,
    imageUrl: 'https://i.imgur.com/5TObwdK.jpeg',
    prompt: 'Happy family enjoying vacation at a beach resort with sunset, lifestyle photography',
    title: 'Lifestyle Photo'
  }
];

// AI-generated insights based on the campaign data
export const insights: string[] = [
  'Campaign C has the highest conversion rate and lowest CPA',
  'Consider increasing the budget for Campaign D with its strong performance',
  'Campaign B is underperforming - review creative and targeting',
  'Campaigns A and D have similar CTR - test new ad variations'
];