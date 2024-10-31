import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import FormBuilder from '@/components/form-builder'

export interface FormBuilderParams {
    toolCallId: string
}

export const formBuilderModule = new ModuleConfigBuilder('showFormBuilder')
    .setDescription('Show form builder')
    .setParameters(z.object({}))
    .setComponent(async ({ toolCallId }: FormBuilderParams) => {
        return (
            <BotCard>
                <FormBuilder toolCallId={toolCallId} />
            </BotCard>
        )
    })
    .build()

export default formBuilderModule
