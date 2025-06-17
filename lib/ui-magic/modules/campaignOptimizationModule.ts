import { z } from 'zod'

// Server-safe module definition
const campaignOptimizationModule = {
  name: 'showCampaignOptimization',
  description: 'Display a UI for managing campaign optimization subscriptions from within the chat',
  parameters: z.object({
    toolCallId: z.string().describe('The ID of the tool call')
  })
}

export default campaignOptimizationModule