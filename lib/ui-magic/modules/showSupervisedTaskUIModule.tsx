import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import SupervisedTaskMessage from '@/components/supervised-task-message'

export interface ShowSupervisedTaskUIModuleParams {}

export const showSupervisedTaskUIModule = new ModuleConfigBuilder(
    'showSupervisedTaskUI'
)
    .setDescription(
        'Display this UI when the user wants to perform actions related to retargeting campaigns, A/B testing between ad sets, duplicating campaigns, or creating lookalike or custom audiences.'
    )
    .setParameters(
        z.object({
            task_name: z
                .string()
                .describe('The task which user asked to perform')
        })
    )
    .setComponent(async ({}: ShowSupervisedTaskUIModuleParams) => {
        return (
            <BotCard>
                <SupervisedTaskMessage />
            </BotCard>
        )
    })
    .build()

export default showSupervisedTaskUIModule
