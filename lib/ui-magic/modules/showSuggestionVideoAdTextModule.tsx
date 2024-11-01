import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'
import { VideoAdTextSuggestion } from '@/components/stocks/video-ad-text-suggestion'
import { VideoAdText } from '@/lib/types'

export interface ShowSuggestionVideoAdTextParams {
    videos: {
        suggestedTexts: VideoAdText[]
    }[]
    guideForUser?: string
}

export const showSuggestionVideoAdTextModule = new ModuleConfigBuilder(
    'showSuggestionVideoAdText'
)
    .setDescription(
        'Show UI to select or input ad text for each video a campaign.'
    )
    .setParameters(
        z.object({
            campaignName: z.string().describe('The name of the campaign'),
            videos: z
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
                                    video_id: z
                                        .string()
                                        .describe('This is ID of this video'),
                                    video: z
                                        .string()
                                        .describe(
                                            'The video link of this video'
                                        ),
                                    thumbnail: z
                                        .string()
                                        .describe(
                                            'The thumbnail link of this video'
                                        ),
                                    date: z.string(),
                                    text: z.string(),
                                    headline: z
                                        .string()
                                        .describe(
                                            'The headline of the ad to display'
                                        )
                                })
                            )
                            .describe('List of suggested video ad texts')
                    })
                )
                .describe('List of videos to display'),
            guideForUser: z
                .string()
                .optional()
                .describe(
                    'This is the guide for user about this component, this is optional'
                )
        })
    )
    .setComponent(
        async ({
            videos = [],
            guideForUser
        }: ShowSuggestionVideoAdTextParams) => {
            return (
                <>
                    <BotCard>
                        <VideoAdTextSuggestion videos={videos} />
                    </BotCard>
                    <div className="my-4">{guideForUser ?? ''}</div>
                </>
            )
        }
    )
    .build()

export default showSuggestionVideoAdTextModule
