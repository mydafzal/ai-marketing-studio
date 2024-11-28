import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { PlacementTargeting } from '@/components/placement-targeting'

export interface ShowPlacementTargetingUIParams {
    toolCallId: string
}

export const showPlacementTargetingUIModule = new ModuleConfigBuilder(
    'showPlacementTargetingUI'
)
    .setDescription('Show a UI to set placement targeting of the campaign')
    .setParameters(z.object({}))
    .setComponent(async ({ toolCallId }: ShowPlacementTargetingUIParams) => {
        return (
            <BotCard>
                <PlacementTargeting toolCallId={toolCallId} />
            </BotCard>
        )
    })
    .build()

export default showPlacementTargetingUIModule
