import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { InjectCampaign } from '@/components/inject-campaign'
import { RefreshChatTitle } from '@/components/refresh-chat-title'

export interface CreateCampaignParams {
    questionForBudget: string
    campaignName: string
    campaignId: string
    adsetId:string
    success: boolean
}

export const createCampaignModule = new ModuleConfigBuilder('createCampaign')
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
                ).optional()
        })
    )
    .setComponent(
        async ({
            success,
            campaignId,
            adsetId,
            campaignName,
            questionForBudget
        }: CreateCampaignParams) => {
            return success ? (
                <BotCard>
                    <p className="mb-2 last:mb-0">{`I created a campaign named "${campaignName}".`}</p>
                    {!!questionForBudget && (
                        <p className="mb-2 last:mb-0">{questionForBudget}</p>
                    )}
                    <InjectCampaign campaignId={campaignId} adsetId={adsetId} />
                    <RefreshChatTitle
                        campaignName={campaignName}
                        campaignId={campaignId}
                    />
                </BotCard>
            ) : (
                <BotCard>
                    <p className="mb-2 last:mb-0">
                        Campaign creation failed, please try again later.
                    </p>
                </BotCard>
            )
        }
    )
    .build()

export default createCampaignModule
