import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { GeographicalLocation } from '@/components/geographical-location';

export interface ShowGeographicalLocationUIParams {
    toolCallId: string
}

export const showGeographicalLocationUIModule = new ModuleConfigBuilder(
    'showGeographicalLocationUI'
)
    .setDescription(
        'Show a UI of result geographical'
    )
    .setParameters(
        z.object({}),
    )
    .setComponent(
        async ({ toolCallId }: ShowGeographicalLocationUIParams) => {
            return (
                <BotCard>
                    <GeographicalLocation toolCallId={toolCallId} />
                </BotCard>
            )
        }
    )
    .build()

export default showGeographicalLocationUIModule
