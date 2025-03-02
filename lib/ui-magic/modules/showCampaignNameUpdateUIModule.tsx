import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { InjectCampaign } from '@/components/inject-campaign'
import { CampaignStatus } from '@/components/stocks/campaign-status'
import { RefreshChatTitle } from '@/components/refresh-chat-title'

export interface ShowCampaignNameUpdateUIParams {
    questionForBudget: string
    campaignName: string
    campaignId: string
}

export const showCampaignNameUpdateUIModule = new ModuleConfigBuilder(
    'showUpdateStatusCampaignUI'
)
    .setDescription(
        'Show a notification that the name of Facebook Ad Campaign is updated. Use this when the user wants to change campaign name. The parameter questionForBudget is optional. It is used only in step 1.'
    )
    .setParameters(
        z.object({
            campaignName: z.string().describe('The name of the campaign'),
            questionForBudget: z
                .string()
                .describe(
                    'The question for the budget with step 2, this is optional'
                )
        })
    )
    .setComponent(
        async ({
            campaignId,
            campaignName,
            questionForBudget
        }: ShowCampaignNameUpdateUIParams) => {
            return (
                <BotCard>
                    <p className="mb-2 last:mb-0">{`Alright, I will update campaign name as "${campaignName}".`}</p>
                    {!!questionForBudget && (
                        <p className="mb-2 last:mb-0">{questionForBudget}</p>
                    )}
                    <InjectCampaign campaignId={campaignId} />
                    <RefreshChatTitle
                        campaignName={campaignName}
                        campaignId={campaignId}
                    />
                </BotCard>
            )
        }
    )
    .build()

export default showCampaignNameUpdateUIModule
