
export interface PaletteAction {
  action: string
  explanation: string
  exampleMessage: string
}

export const paletteActions: PaletteAction[] = [
  {
    action: 'Create a Facebook campaign',
    explanation: 'Set up a new ad campaign on Facebook to reach your target audience.',
    exampleMessage: 'Create a Facebook campaign',
  },
  {
    action: 'Connect to an existing campaign',
    explanation: 'Link your account to an existing ad campaign for better management.',
    exampleMessage: 'I would like to connect to a campaign',
  },
  {
    action: 'Create a lead form',
    explanation: 'Generate a form to collect user contact information for leads.',
    exampleMessage: 'I would like to create a lead form',
  },
  {
    action: 'Choose ad placements',
    explanation: 'Decide where your ads will appear, such as Instagram Reels or Facebook Stories.',
    exampleMessage: 'I would like to select ad placements',
  },
  {
    action: 'Define targeting',
    explanation: 'Specify the demographics, interests, and behaviors of your target audience.',
    exampleMessage: 'I want to define my audience targeting',
  },
  {
    action: 'Assign campaign budget',
    explanation: 'Allocate a specific budget for your ad campaign.',
    exampleMessage: 'Set the budget for my campaign',
  },
  {
    action: 'Add image for ad',
    explanation: 'Include an image to visually enhance your advertisement.',
    exampleMessage: 'I need to add an image to my ad',
  },
  {
    action: 'Add video for ad',
    explanation: 'Upload a video to make your ad more engaging and interactive.',
    exampleMessage: 'I want to add a video to my ad',
  },
  {
    action: 'Get campaign results',
    explanation: 'Retrieve and review the performance metrics for your ad campaign.',
    exampleMessage: 'Show me the results of my campaign',
  },
  {
    action: 'Switch Adset',
    explanation: 'Connect your chat to a different ad set.',
    exampleMessage: 'Show me adset connection UI.',
  }
]
