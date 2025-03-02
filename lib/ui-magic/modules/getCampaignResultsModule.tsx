import { z } from 'zod'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { BotCard } from '@/components/stocks'
import { Stock } from '@/components/stocks/campaignresultsnew'

export interface GetCampaignResultsParams {
    campaignId: string
    guideForUser: string
}

export const getCampaignResultsModule = new ModuleConfigBuilder(
    'getCampaignResults'
)
    .setDescription(
        'Get the current campaign results of a given digital marketing campaign from this user. Use this to show the current daily ad spent to the user.'
    )
    .setParameters(
        z.object({
            campaignId: z.string().describe('The id of the campaign.'),
            guideForUser: z
                .string()
                .optional()
                .describe(
                    'This is the guide for user about this component, this is optional'
                )
        })
    )
    .setComponent(
        async ({ campaignId, guideForUser }: GetCampaignResultsParams) => {
            return (
                <>
                    <BotCard>
                        <Stock campaignId={campaignId} isActive />
                    </BotCard>
                    <div className="my-4">{guideForUser ?? ''}</div>
                </>
            )
        }
    )
    .build()

export default getCampaignResultsModule
