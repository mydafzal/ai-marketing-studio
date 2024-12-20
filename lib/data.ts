import { VideoAdText } from '@/lib/types'

export const generateAdTemplate = (
  headline: string,
  text: string,
  image: string,
  pageId: number|null = null
) => ({
  name: 'New Link Ad Creative',
  object_story_spec: {
    page_id:pageId || 119021011189054,
    link_data: {
      link: 'https://www.example.com',
      name: headline,
      message: text,
      call_to_action: {
        type: 'SIGN_UP',
        value: {
          lead_gen_form_id: 8902951086385726
        }
      },
      image_url: image
    }
  }
})
export const generateVideoAdTemplate = (
  headline: string, 
  text: string, 
  video: VideoAdText,
  pageId: number|null = null
) => ({
  name: 'New Video Ad Creative',
  object_story_spec: {
    page_id: pageId || 119021011189054,
    video_data: {
      video_id: video.video_id,
      image_url: video.thumbnail,
      call_to_action: {
        type: 'LEARN_MORE',
        value: {
          link: 'https://www.example.com',
        }
      },
      title: headline,
      message: text,
    }
  }
})
export const generateAdsetTemplate = (pageId: number|null = null) => ({
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
      // location_types: ['home', 'recent']
    },
    publisher_platforms: ['facebook', 'instagram'],
    facebook_positions: [
      'feed',
      'facebook_reels',
    ],
    instagram_positions: [
      'stream',
      'explore',
      'reels',
    ],
    device_platforms: ['mobile', 'desktop']
  },
  promoted_object: {
    page_id: pageId || 119021011189054
  },
  status: 'PAUSED'
})

export const targetPositions = [
  { value: 'feed', platform: 'facebook', label: 'Facebook feed' },
  {
    value: 'right_hand_column',
    platform: 'facebook',
    label: 'Facebook right hand column'
  },
  { value: 'marketplace', platform: 'facebook', label: 'Facebook marketplace' },
  { value: 'video_feeds', platform: 'facebook', label: 'Facebook video feeds' },
  { value: 'story', platform: 'facebook', label: 'Facebook story' },
  { value: 'search', platform: 'facebook', label: 'Facebook search' },
  {
    value: 'instream_video',
    platform: 'facebook',
    label: 'Facebook instream video'
  },
  {
    value: 'facebook_reels',
    platform: 'facebook',
    label: 'Facebook reels'
  },
  {
    value: 'profile_feed',
    platform: 'facebook',
    label: 'Facebook profile feed'
  },
  { value: 'stream', platform: 'instagram', label: 'Instagram stream' },
  {
    value: 'explore',
    platform: 'instagram',
    parent: 'stream',
    label: 'Instagram explore'
  },
  {
    value: 'explore_home',
    platform: 'instagram',
    parent: 'stream',
    label: 'Instagram explore home'
  },
  {
    value: 'profile_feed',
    platform: 'instagram',
    parent: 'stream',
    label: 'Instagram profile feed'
  },
  {
    value: 'ig_search',
    platform: 'instagram',
    parent: 'stream',

    label: 'Instagram search'
  },
  {
    value: 'profile_reels',
    platform: 'instagram',
    parent: 'stream',
    label: 'Instagram profile reels'
  },
  { value: 'story', platform: 'instagram', label: 'Instagram story' },
  { value: 'reels', platform: 'instagram', label: 'Instagram reels' }
]
