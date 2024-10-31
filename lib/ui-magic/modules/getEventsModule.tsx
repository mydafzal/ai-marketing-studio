import { z } from 'zod'
import { BotCard, Events } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'

export interface GetEventsParams {
    events: {
        headline: string
        description: string
    }[]
}

export const getEventsModule = new ModuleConfigBuilder('getEvents')
    .setDescription(
        'List Tips which provide helpful information to users on how they could improve their campaigns.'
    )
    .setParameters(
        z.object({
            events: z.array(
                z.object({
                    headline: z.string().describe('The headline of the event'),
                    description: z
                        .string()
                        .describe('The description of the event')
                })
            )
        })
    )
    .setComponent(async ({ events }: GetEventsParams) => {
        return (
            <BotCard>
                <Events props={events} />
            </BotCard>
        )
    })
    .build()

export default getEventsModule
