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
import AdCreativesSwitcher from "@/components/ad-creatives-switcher/index";
import {UserMessage} from "@/components/stocks/message";
import {TextPart} from "ai";
import {AdTextSuggestion} from '@/components/stocks/ad-text-suggestion'
import {CampaignStatus} from '@/components/stocks/campaign-status'
import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'
import {GeographicalLocation} from '@/components/geographical-location';
import {SuggestedFilters} from '@/components/suggested-filters';
import LeadsCountUI from '@/components/campaign-leads-count'
import AICampaignAnalysisBoard from "@/components/ai-campaign-analysis-board";
import { SidebarContentWrapper } from '@/components/sidebar-content-wrapper';

// Import only what we need for server component import below
import dynamic from 'next/dynamic';

interface ToolResult {
    toolName: string;
    toolCallId: string;
    result: any; // You might want to make this more specific based on your data
}

export const getUIStateFromAIState = (aiState: Chat) => {
    return aiState.messages
        .filter((message: Message) => {
            // Filter out system messages
            if (message.role === 'system') return false;
            
            // Filter out messages explicitly marked as hidden
            if (message.hidden === true) return false;
            
            // Filter out any assistant messages containing ad creative results info
            // This specifically targets the messages added by the campaignresults-creatives component
            if (message.role === 'assistant' && 
                typeof message.content === 'string' && 
                (message.content.includes("ad creatives for campaign") || 
                 message.content.includes("performance metrics are now displayed"))) {
                return false;
            }
            
            // Filter out any user messages sent in silent mode that contain "System:" prefix
            // This handles the case of adcreative results messages sent with System: prefix
            if ((message.role === 'user' || message.role === 'assistant') && 
                typeof message.content === 'string' && 
                message.content.startsWith("System:")) {
                return false;
            }
            
            return true;
        })
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
                                // Only render the BotCard message in the chat
                                // The server component will handle loading and displaying in sidebar
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <p>Campaign creative performance metrics are now displayed in the sidebar. You can analyze which ads are performing best and make adjustments as needed.</p>
                                    </BotCard>
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
                                // Use sidebar instead of chat
                                return (
                                    <>
                                        <SidebarContentWrapper 
                                            content={<ConnectAdset {...tool.result} toolCallId={tool.toolCallId}/>}
                                            title="Connect Ad Set"
                                            onMount={true}
                                        />
                                        <BotCard key={tool.toolCallId}>
                                            <p>The ad set selection interface is now available in the sidebar. You can choose which ad set to connect to this chat.</p>
                                        </BotCard>
                                    </>
                                );
                            case 'showPlacementTargetingUI':
                                // Use sidebar instead of chat
                                return (
                                    <>
                                        <SidebarContentWrapper 
                                            content={<PlacementTargeting {...tool.result} toolCallId={tool.toolCallId}/>}
                                            title="Placement Targeting"
                                            onMount={true}
                                        />
                                        <BotCard key={tool.toolCallId}>
                                            <p>Placement targeting options are now available in the sidebar. You can configure where your ads will be displayed.</p>
                                        </BotCard>
                                    </>
                                );
                            case 'showFormBuilder':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <FormBuilder {...tool.result} toolCallId={tool.toolCallId} isReadOnly/>
                                    </BotCard>
                                )
                            case 'showGeographicalLocationUI':
                                // Use sidebar instead of chat
                                return (
                                    <>
                                        <SidebarContentWrapper 
                                            content={
                                                <GeographicalLocation
                                                    toolCallId={tool.toolCallId}
                                                    uiProps={tool.result.uiProps}
                                                    isReadOnly={!!tool.result.uiProps}
                                                />
                                            }
                                            title="Geographical Targeting"
                                            onMount={true}
                                        />
                                        <BotCard key={tool.toolCallId}>
                                            <p>Geographical targeting options are now available in the sidebar. You can select regions where your ads will be shown.</p>
                                        </BotCard>
                                    </>
                                );
                            case 'showSuggestedFilters':
                                // Use sidebar instead of chat
                                return (
                                    <>
                                        <SidebarContentWrapper 
                                            content={
                                                <SuggestedFilters 
                                                    toolCallId={tool.toolCallId}
                                                    suggestedFitlers={tool.result.suggestedFitlers}
                                                    uiProps={tool.result.uiProps} 
                                                    isReadOnly
                                                />
                                            }
                                            title="Suggested Audience Filters"
                                            onMount={true}
                                        />
                                        <BotCard key={tool.toolCallId}>
                                            <p>Suggested audience filters are now available in the sidebar. You can refine your audience targeting from there.</p>
                                        </BotCard>
                                    </>
                                );
                            case 'showSupervisedTaskUI':
                                return (
                                    <>
                                        <BotCard>
                                            <SupervisedTaskMessage result={tool.result}/>
                                        </BotCard>
                                    </>
                                );
                            case 'showAdCreativesSwitcher':
                                // Show directly in chat instead of sidebar
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <div className="w-full max-h-[80vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-md">
                                            <AdCreativesSwitcher />
                                        </div>
                                    </BotCard>
                                );
                            case 'showLeadsCountUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <LeadsCountUI toolCallId={tool.result.toolCallId} toolCallResult={tool.result?.toolCallResult}/>
                                    </BotCard>
                                )
                            case 'getAICampaignAnalysis':
                                // Use sidebar instead of chat
                                return (
                                    <>
                                        <SidebarContentWrapper 
                                            content={<AICampaignAnalysisBoard campaignId={tool.result.campaignId} isActive={false} />}
                                            title="AI Campaign Analysis"
                                            onMount={true}
                                        />
                                        <BotCard key={tool.toolCallId}>
                                            <p>AI campaign analysis is now available in the sidebar. Review the detailed performance metrics and recommendations to optimize your campaign.</p>
                                        </BotCard>
                                    </>
                                );
                            case 'showLeadNotifications':
                                // Create a dynamic component for the UI
                                const LeadNotificationsComponent = dynamic(() => 
                                    import('@/lib/ui-magic/modules/showLeadNotificationsModule'), 
                                    { ssr: false }
                                );
                                
                                // Display only in sidebar
                                return (
                                    <>
                                        {/* This component handles showing in the sidebar */}
                                        <LeadNotificationsComponent />
                                        
                                        {/* Just show a message in the chat */}
                                        <BotCard key={tool.toolCallId}>
                                            <p>Lead notification preferences are now available in the sidebar. You can select which campaigns you want to receive notifications for.</p>
                                        </BotCard>
                                    </>
                                );
                            case 'showCampaignOptimization':
                                // Create a dynamic component for the UI
                                const CampaignOptimizationComponent = dynamic(() => 
                                    import('@/lib/ui-magic/modules/showCampaignOptimizationModule'), 
                                    { ssr: false }
                                );
                                
                                // Display only in sidebar
                                return (
                                    <>
                                        {/* This component handles showing in the sidebar */}
                                        <CampaignOptimizationComponent />
                                        
                                        {/* Just show a message in the chat */}
                                        <BotCard key={tool.toolCallId}>
                                            <p>Campaign optimization settings are now available in the sidebar. You can select which campaigns you want to enable automatic optimization for.</p>
                                        </BotCard>
                                    </>
                                );
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