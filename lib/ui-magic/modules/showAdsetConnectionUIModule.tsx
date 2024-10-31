import { z } from 'zod'
import { BotCard } from '@/components/stocks'

import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { ConnectAdset } from '@/components/connect-adset'

export interface ShowCampaignConnectionUIParams {
    toolCallId: string
}

export const showAdsetConnectionUIModule = new ModuleConfigBuilder(
    'showAdsetConnectionUI'
)
    .setDescription('Show a UI to connect a adset to the chat.')
    .setParameters(z.object({}))
    .setComponent(async ({ toolCallId }: ShowCampaignConnectionUIParams) => {
        return (
            <BotCard>
                <ConnectAdset toolCallId={toolCallId} />
            </BotCard>
        )
    })
    .build()

export default showAdsetConnectionUIModule
