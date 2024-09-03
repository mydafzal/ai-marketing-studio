import { AdText } from '@/lib/types'

export const generateAdTemplate = (adText: AdText) => ({
  name: 'New Link Ad Creative',
  object_story_spec: {
    page_id: 119021011189054,
    link_data: {
      link: 'https://www.example.com',
      name: adText.headline,
      message: adText.text,
      call_to_action: {
        type: 'SIGN_UP',
        value: {
          lead_gen_form_id: 8902951086385726
        }
      },
      image_url: adText.image
    }
  }
})

export const generateAdsetTemplate = () => ({
  name: 'My Ad Set',
  bid_amount: 2,
  billing_event: 'IMPRESSIONS',
  optimization_goal: 'REACH',
  targeting: {
    age_max: 65,
    age_min: 18,
    flexible_spec: [
      {
        interests: [
          {
            id: '6003214937861',
            name: 'Self-employment'
          },
          {
            id: '6003374632277',
            name: 'Freelancer'
          }
        ]
      }
    ],
    geo_locations: {
      countries: ['NL', 'DE'],
      location_types: ['home', 'recent']
    },
    publisher_platforms: ['facebook', 'instagram'],
    facebook_positions: [
      'feed',
      'facebook_reels',
      'video_feeds',
      'marketplace',
      'story'
    ],
    instagram_positions: [
      'stream',
      'story',
      'explore',
      'reels',
      'explore_home'
    ],
    device_platforms: ['mobile', 'desktop']
  },
  promoted_object: {
    page_id: 119021011189054
  },
  status: 'PAUSED'
})
