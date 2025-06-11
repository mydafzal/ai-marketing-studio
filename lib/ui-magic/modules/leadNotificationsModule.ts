import { z } from 'zod'

// Server-safe module definition
const leadNotificationsModule = {
  name: 'showLeadNotifications',
  description: 'Display a UI for managing lead notification subscriptions from within the chat',
  parameters: z.object({
    toolCallId: z.string().describe('The ID of the tool call')
  })
}

export default leadNotificationsModule