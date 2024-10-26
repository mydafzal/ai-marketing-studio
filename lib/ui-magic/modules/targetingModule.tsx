import {z} from 'zod';
import {BotCard, SystemMessage} from '@/components/stocks';
import {ModuleConfigBuilder} from "@/lib/ui-magic/moduleConfigBuilder";
import {getMutableAIState} from "ai/rsc";
import {nanoid} from "nanoid";

interface TargetingParams {
    campaignType: 'recruiting' | 'lead' | 'retargeting';
    userDescription: string;
}

export const targetingModule = new ModuleConfigBuilder('analyzeCampaignTargeting')
    .setDescription('Analyze campaign for targeting suggestions based on campaign type and description')
    .setParameters(z.object({
        campaignType: z.enum(['recruiting', 'lead', 'retargeting']),
        userDescription: z.string().describe('User description of target audience')
    }))
    .setComponent(async ({ campaignType, userDescription }: TargetingParams) => {
        const aiState = getMutableAIState();

        // Show initial state with spinner
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Inject targeting filters into AI context
        aiState.done({
            ...aiState.get(),
            messages: [
                ...aiState.get().messages,
                {
                    id: nanoid(),
                    role: 'system',
                    content: `Available targeting filters for your reference: ${TARGETING_FILTERS}`,
                    timestamp: new Date().toISOString()
                }
            ]
        });

        return (
            <BotCard>
                <SystemMessage>
                    I have analyzed your campaign requirements and loaded the targeting options.
                    I will now help you select the most relevant filters based on your description
                    for a {campaignType} campaign.
                </SystemMessage>
            </BotCard>
        );
    })
    .build();

export default targetingModule;