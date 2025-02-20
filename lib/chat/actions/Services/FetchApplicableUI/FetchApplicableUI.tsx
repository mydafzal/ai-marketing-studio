import {Chat, Message} from "@/lib/types";
import {BotCard, BotMessage, Purchase} from "@/components/stocks";
import {Stock} from "@/components/stocks/campaignresultsnew";
import {Events} from "@/components/stocks/events";
import {VideoAdTextSuggestion} from "@/components/stocks/video-ad-text-suggestion";
import {ChatImage} from "@/components/chat-images";
import {ConnectCampaign} from "@/components/connect-campaign";
import {ConnectAdset} from "@/components/connect-adset";
import {PlacementTargeting} from "@/components/placement-targeting";
import FormBuilder from "@/components/form-builder";
import SupervisedTaskMessage from "@/components/supervised-task-message";
import AdCreativesSwitcher from "@/components/ad-creatives-switcher";
import {UserMessage} from "@/components/stocks/message";
import {TextPart} from "ai";
import {AdTextSuggestion} from '@/components/stocks/ad-text-suggestion'
import {CampaignStatus} from '@/components/stocks/campaign-status'
import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'
import {GeographicalLocation} from '@/components/geographical-location';
import {SuggestedFilters} from '@/components/suggested-filters';
import LeadsCountUI from '@/components/campaign-leads-count'
import AdCreativesComparison from '@/components/stocks/campaignresults-creatives';

interface ToolResult {
    toolName: string;
    toolCallId: string;
    result: any; // You might want to make this more specific based on your data
}

export const getUIStateFromAIState = (aiState: Chat) => {
    return aiState.messages
        .filter((message: Message) => message.role !== 'system')
        .map((message: Message, index: number) => ({
            id: `${aiState.chatId}-${index}`,
            display:
                message.role === 'tool' && isToolResultArray(message.content) ? (
                    message.content.map((tool: ToolResult) => {
                        switch (tool.toolName) {
                            case 'showStockPrice':
                            case 'getCampaignResults':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <Stock campaignId={tool.result.campaignId} isActive/>
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                );
                            case 'getCampaignCreativeResults':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <AdCreativesComparison campaignId={tool.result.campaignId} />
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                );
                            case 'showAdBudgetUI':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <Purchase props={tool.result}/>
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                );
                            case 'getEvents':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <Events props={tool.result}/>
                                    </BotCard>
                                );
                            case 'showSuggestionAdText':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <AdTextSuggestion props={tool.result.images}/>
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                );
                            case 'showVideoAdTextSuggestion':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <VideoAdTextSuggestion {...tool.result} />
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                )
                            case 'getCampaignImages':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ChatImage/>
                                    </BotCard>
                                );
                            case 'showCampaignNameUpdateUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <p className="mb-2 last:mb-0">{`Alright, I will update campaign name as "${tool.result.campaignName}".`}</p>
                                        {!!tool.result.questionForBudget &&
                                            <p className="mb-2 last:mb-0">{tool.result.questionForBudget}</p>}
                                    </BotCard>
                                )
                            case 'createCampaign':
                                return tool.result.success ? (
                                    <BotCard key={tool.toolCallId}>
                                        <p className="mb-2 last:mb-0">{`I created a campaign named "${tool.result.campaignName}".`}</p>
                                        {!!tool.result.questionForBudget &&
                                            <p className="mb-2 last:mb-0">{tool.result.questionForBudget}</p>}
                                    </BotCard>
                                ) : (
                                    <BotCard>
                                        <p className="mb-2 last:mb-0">Campaign creation failed, please try again
                                            later.</p>
                                    </BotCard>
                                )
                            case 'showUpdateStatusCampaign':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <CampaignStatus
                                            props={{
                                                toolCallId: tool.toolCallId,
                                                campaignName:
                                                tool.result.campaignName,
                                                status: tool.result.status
                                            }}
                                        />
                                    </BotCard>
                                )
                            case 'showCampaignConnectionUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ConnectCampaign {...tool.result} />
                                    </BotCard>
                                )
                            case 'showAdsetConnectionUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ConnectAdset {...tool.result} toolCallId={tool.toolCallId}/>
                                    </BotCard>
                                )
                            case 'showPlacementTargetingUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <PlacementTargeting {...tool.result} toolCallId={tool.toolCallId}/>
                                    </BotCard>
                                )
                            case 'showFormBuilder':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <FormBuilder {...tool.result} toolCallId={tool.toolCallId} isReadOnly/>
                                    </BotCard>
                                )
                            case 'showGeographicalLocationUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <GeographicalLocation
                                            toolCallId={tool.toolCallId}
                                            uiProps={tool.result.uiProps}
                                            isReadOnly={!!tool.result.uiProps}
                                        />
                                    </BotCard>
                                )
                            case 'showSuggestedFilters':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <SuggestedFilters toolCallId={tool.toolCallId}
                                                          suggestedFitlers={tool.result.suggestedFitlers}
                                                          uiProps={tool.result.uiProps} isReadOnly/>
                                    </BotCard>
                                )
                            case 'showGeographicalLocationUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <GeographicalLocation
                                            toolCallId={tool.toolCallId}
                                            uiProps={tool.result.uiProps}
                                            isReadOnly={!!tool.result.uiProps}
                                        />
                                    </BotCard>
                                )
                            case 'showSuggestedFilters':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <SuggestedFilters toolCallId={tool.toolCallId}
                                                          suggestedFitlers={tool.result.suggestedFitlers}
                                                          uiProps={tool.result.uiProps} isReadOnly/>
                                    </BotCard>
                                )
                            case 'showSupervisedTaskUI':
                                return (
                                    <>
                                        <BotCard>
                                            <SupervisedTaskMessage result={tool.result}/>
                                        </BotCard>
                                    </>
                                );
                            case 'showAdCreativesSwitcher':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <AdCreativesSwitcher {...tool.result} toolCallId={tool.toolCallId}/>
                                    </BotCard>
                                )
                            case 'showLeadsCountUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <LeadsCountUI toolCallId={tool.result.toolCallId} toolCallResult={tool.result?.toolCallResult}/>
                                    </BotCard>
                                )
                            default:
                                return null;
                        }
                    })
                ) : message.role === 'user' ? (
                    <UserMessage
                        userContent={message.content} timestamp={message.timestamp}>{(Array.isArray(message.content) ? (message.content[0] as TextPart).text : message.content) as string}
                        </UserMessage>

                ) : message.role === 'assistant' &&
                typeof message.content === 'string' ? (
                    <BotMessage content={message.content} timestamp={message.timestamp}/>
                ) : null
        }))
        .filter((message: { id: string, display: any }) => Boolean(message.display))
}

function isToolResultArray(content: string | ToolResult[]): content is ToolResult[] {
    return Array.isArray(content);
}