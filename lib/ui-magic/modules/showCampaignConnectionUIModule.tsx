import { z } from 'zod'
import { BotCard } from '@/components/stocks'

import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { ConnectCampaign } from '@/components/connect-campaign'

export interface ShowCampaignConnectionUIParams {}

export const showCampaignConnectionUIModule = new ModuleConfigBuilder(
    'showCampaignConnectionUI'
)
    .setDescription('Show a UI to connect a campaign to the chat.')
    .setParameters(z.object({}))
    .setComponent(async ({}: ShowCampaignConnectionUIParams) => {
        return (
            <BotCard>
                <ConnectCampaign />
            </BotCard>
        )
    })
    .build()

export default showCampaignConnectionUIModule
