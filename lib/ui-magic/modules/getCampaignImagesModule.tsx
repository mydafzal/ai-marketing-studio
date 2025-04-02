import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { ChatImage } from '@/components/chat-images'

export interface GetCampaignImagesParams {}

export const getCampaignImagesModule = new ModuleConfigBuilder(
    'getCampaignImages'
)
    .setDescription(
        'Get the current images of campaign of a given digital marketing campaign from this user. Use this to show the campaign images to the user.'
    )
    .setParameters(z.object({}))
    .setComponent(async ({}: GetCampaignImagesParams) => {
        return (
            <BotCard>
                <ChatImage />
            </BotCard>
        )
    })
    .build()

export default getCampaignImagesModule
