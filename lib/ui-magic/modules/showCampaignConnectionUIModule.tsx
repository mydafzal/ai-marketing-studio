import { z } from 'zod'
import { BotCard } from '@/components/stocks/message'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { ConnectCampaign } from '@/components/connect-campaign'
import { ConnectCampaignActiveUIWrapper } from '@/components/connect-campaign/active-ui-wrapper'

export interface ShowCampaignConnectionUIParams {
  connectingUiProps?: {
    campaignName: string
    success: boolean
  }
}

export const showCampaignConnectionUIModule = new ModuleConfigBuilder(
    'showCampaignConnectionUI'
)
    .setDescription('Show a UI to connect a campaign to the chat.')
    .setParameters(z.object({
      connectingUiProps: z.object({
        campaignName: z.string().optional(),
        success: z.boolean().optional()
      }).optional()
    }))
    .setComponent(({ connectingUiProps }: ShowCampaignConnectionUIParams) => {
        // Both parts: 
        // 1. Register with active UI for sidebar display
        // 2. Return a BotCard for display in chat
        return (
            <>
                <ConnectCampaignActiveUIWrapper connectingUiProps={connectingUiProps} />
                <BotCard>
                    <p>
                        You can select from available campaigns in the sidebar. 
                        Choose an existing campaign to connect to this chat or create a new one.
                    </p>
                </BotCard>
            </>
        )
    })
    .build()

export default showCampaignConnectionUIModule
