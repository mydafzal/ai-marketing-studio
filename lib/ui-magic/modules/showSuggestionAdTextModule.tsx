import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { AdTextSuggestion } from '@/components/stocks/ad-text-suggestion'

export interface ShowSuggestionAdTextParams {
    images: {
        suggestedTexts: {
            id: number
            image: string
            date: string
            text: string
            headline?: string
        }[]
    }[]
    guideForUser?: string
}

export const showSuggestionAdTextModule = new ModuleConfigBuilder(
    'showSuggestionAdText'
)
    .setDescription(
        'Show UI to select or input ad text for each image a campaign.'
    )
    .setParameters(
        z.object({
            campaignName: z.string().describe('The name of the campaign'),
            images: z
                .array(
                    z.object({
                        suggestedTexts: z
                            .array(
                                z.object({
                                    id: z
                                        .number()
                                        .describe(
                                            'This is timestamp of current time'
                                        ),
                                    image: z
                                        .string()
                                        .describe(
                                            'The link of the image to display'
                                        ),
                                    date: z.string(),
                                    text: z.string(),
                                    headline: z
                                        .string()
                                        .optional()
                                        .describe(
                                            'The headline of the ad to display'
                                        )
                                })
                            )
                            .describe('List of suggested ad texts')
                    })
                )
                .describe('List of images to display'),
            guideForUser: z
                .string()
                .optional()
                .describe(
                    'This is the guide for user about this component, this is optional'
                )
        })
    )
    .setComponent(
        async ({ images, guideForUser }: ShowSuggestionAdTextParams) => {
            return (
                <>
                    <BotCard>
                        <AdTextSuggestion props={images} />
                    </BotCard>
                    <div className="my-4">{guideForUser ?? ''}</div>
                </>
            )
        }
    )
    .build()

export default showSuggestionAdTextModule
