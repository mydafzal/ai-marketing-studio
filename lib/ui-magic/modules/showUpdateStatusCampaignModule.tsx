import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { CampaignStatus } from '@/components/stocks/campaign-status'

export interface ShowUpdateStatusCampaignParams {
    toolCallId: string
    campaignName: string
    status: string
}

export const showUpdateStatusCampaignModule = new ModuleConfigBuilder(
    'showUpdateStatusCampaign'
)
    .setDescription('Show UI  to update status of the campaign.')
    .setParameters(
        z.object({
            campaignName: z.string().describe('The name of the campaign'),
            status: z.string().describe('The current status of the campaign')
        })
    )
    .setComponent(
        async ({
            toolCallId,
            campaignName,
            status
        }: ShowUpdateStatusCampaignParams) => {
            return (
                <BotCard>
                    <CampaignStatus
                        props={{ toolCallId, campaignName, status }}
                    />
                </BotCard>
            )
        }
    )
    .build()

export default showUpdateStatusCampaignModule
