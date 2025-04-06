import { z } from 'zod'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'

export interface BrowserResearchParams {
    researchQuery?: string
}

export const browserResearchModule = new ModuleConfigBuilder(
    'browserResearch'
)
    .setDescription(
        'Let an AI agent browse the web to research something for the user. The agent will perform the research and return the results directly to the chat. Use this when the user needs to find information from the web.'
    )
    .setParameters(
        z.object({
            researchQuery: z
                .string()
                .optional()
                .describe(
                    'The query or topic to research. This will be used as the initial prompt for the browser agent.'
                )
        })
    )
    .setComponent(
        async ({ researchQuery }: BrowserResearchParams) => {
            // Dynamic import to keep bundle size small
            const showBrowserUse = (await import('@/components/stocks/browser-use/server')).default
            return showBrowserUse({ researchQuery })
        }
    )
    .build()

export default browserResearchModule