import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import SupervisedTaskMessage from '@/components/supervised-task-message'

export interface ShowSupervisedTaskUIModuleParams {}

export const showSupervisedTaskUIModule = new ModuleConfigBuilder(
    'showSupervisedTaskUI'
)
    .setDescription(
        'Show this UI if user want to perform anything related to "retargeting campaign" or "AB testing between adsets"'
    )
    .setParameters(
        z.object({
            task_name: z
                .string()
                .describe('Name of the task which user asked to perform')
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
