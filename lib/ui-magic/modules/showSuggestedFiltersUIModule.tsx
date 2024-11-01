import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { SuggestedFilters } from '@/components/suggested-filters';

export interface ShowSuggestedFiltersUIParams {
    suggestedFitlers: string[][]
    toolCallId: string
}

export const showSuggestedFiltersUIModule = new ModuleConfigBuilder(
    'showSuggestedFilters'
)
    .setDescription(
        'Show a UI of result suggested filters'
    )
    .setParameters(
        z.object({
            suggestedFitlers: z.array(
                z.array(
                    z.string().describe('filter name of suggestion')
                )
            ).describe('The array of suggested filters from AI provided, a suggestion filter will have one or more filter name')
        }),
    )
    .setComponent(
        async ({ suggestedFitlers, toolCallId }: ShowSuggestedFiltersUIParams) => {
            return (
                <BotCard>
                    <SuggestedFilters toolCallId={toolCallId} suggestedFitlers={suggestedFitlers}  />
                </BotCard>
            )
        }
    )
    .build()

export default showSuggestedFiltersUIModule
