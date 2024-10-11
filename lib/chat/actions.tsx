import 'server-only'

import {createAI, createStreamableUI, createStreamableValue, getAIState, getMutableAIState, streamUI} from 'ai/rsc'
import {openai} from '@ai-sdk/openai'
import {BotCard, BotMessage, Purchase, spinner, Stock, SystemMessage, SystemErrorMessage} from '@/components/stocks'
import {AdTextSelectionSkeleton} from '@/components/stocks/ad-text-selection-skeleton'
import {z} from 'zod'
import {EventsSkeleton} from '@/components/stocks/events-skeleton'
import {Events} from '@/components/stocks/events'
import {PurchasingUi} from '@/components/stocks/purchasing-ui'
import {StockSkeleton} from '@/components/stocks/stock-skeleton'
import {AdTextSuggestion} from '@/components/stocks/ad-text-suggestion'
import {VideoAdTextSuggestion} from '@/components/stocks/video-ad-text-suggestion'
import {RefreshChatTitle} from '@/components/refresh-chat-title'
import {InjectCampaign} from '@/components/inject-campaign'
import {CampaignStatus} from '@/components/stocks/campaign-status'
import {
    fetchChatCampaignBudget,
    fetchFbCampaignExtraDetailsForChat,
    fetchUserDefaultExtraDetails,
    saveChat,
    updateChatCampaignBudget,
    updateChat,
    updateChatTitle
} from '@/app/actions'
import {differenceInHours} from 'date-fns';
import {ChatImage} from '@/components/chat-images'
import {ImagePart, TextPart} from 'ai'

import {formatNumber, nanoid, runAsyncFnWithoutBlocking, sleep} from '@/lib/utils'
import {SpinnerMessage, UserMessage} from '@/components/stocks/message'
import {Adset, AdText, Chat, Message, Session} from '@/lib/types';
import {auth} from '@/auth'
import {setDailyCampaignBudget} from '@/lib/api/fasty-bot/set-daily-campaign-budget';
import {setCampaignStatus} from '@/lib/api/fasty-bot/set-campaign-status';
import {createCampaignAd} from '@/lib/api/fasty-bot/create-ad';
import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'
import {CampaignSummary} from '@/lib/api/fasty-bot/get-campaign-summary'
import {updateCampaign} from '@/lib/api/fasty-bot/update-campaign';
import {updateAdset} from '@/lib/api/fasty-bot/update-adset';
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {sendAdminNotification} from '@/lib/api/fasty-bot/send-admin-notification'
import {ConnectCampaign} from '@/components/connect-campaign'
import {PlacementTargeting} from '@/components/placement-targeting';

interface ToolResult {
    toolName: string;
    toolCallId: string;
    result: any; // You might want to make this more specific based on your data
}

async function checkNewChat(chatId: string, messages: Message[], session: Session | null) {
    if (!session?.user) return false;

    const disabledEmails = [
        'teo.kostelac@outlook.com',
        'contact@reeply.net',
        'themadnoise@gmail.com',
        'maxnols@reeply.net',
    ];

    if (disabledEmails.includes(session.user.email)) return false;

    const userMessages = messages.filter(message => message.role === 'user')
    const now = new Date()
    const hasNewMessage = userMessages.some(message => {
        if (!message?.timestamp) return false
        const hoursDiff = differenceInHours(now, message.timestamp)
        return hoursDiff < 16
    })
    if (!hasNewMessage) {
        await sendAdminNotification(chatId)
    }
}

async function confirmPurchase(campaignName: string, budget: number, days: number = 30) {
    'use server'

    const aiState = getMutableAIState<typeof AI>();
    const totalBudget = budget * days;
    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place
    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {
        campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0'
    }
    const chatId = getChatIdFromUrl()?.toString() || '';

    const purchasing = createStreamableUI(
        <div className="inline-flex items-start gap-1 md:items-center">
            {spinner}
            <p className="mb-2">
                Setting the ad budget for {campaignName} to {formatNumber(budget)} per day...
            </p>
        </div>
    );

    const systemMessage = createStreamableUI(null);
    const newMessageStream = createStreamableUI(null);

    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        purchasing.update(
            <div className="inline-flex items-start gap-1 md:items-center">
                {spinner}
                <p className="mb-2">
                    Almost there, configuring the budget for {campaignName}...
                </p>
            </div>
        );

        const updateSuccess = await setDailyCampaignBudget(campaignId, budget);

        if (updateSuccess) {
            await updateChatCampaignBudget(chatId, budget);

            systemMessage.done(
                <SystemMessage>
                    Your ad campaign &apos;{campaignName}&apos; is now set to run for {days} days with a daily budget of
                    {formatNumber(budget)}. Total budget: {formatNumber(totalBudget)}. The budget has been updated on
                    Facebook.
                </SystemMessage>
            );
        } else {
            systemMessage.done(
                <SystemMessage>
                    There was an error updating the budget for campaign &apos;{campaignName}&apos; on Facebook. Please
                    check your connection and try again.
                </SystemMessage>
            );
        }

        purchasing.done(
            <PurchasingUi
                success={updateSuccess}
                budget={budget}
                campaignName={campaignName}
                days={days}
                totalBudget={totalBudget}
            />
        );

        const newMessage = 'Wanna go on?';
        // optimistic update
        newMessageStream.done(
            <div>
                {newMessage}
            </div>
        );

        // Prompting AI to ask a follow-up question or make a suggestion
        aiState.done({
            ...aiState.get(),
            messages: [
                ...aiState.get().messages.map(message => {
                    if (message.role === 'tool') {
                        const content = message.content[0];
                        if (content.type === 'tool-result' && content.toolName === 'showAdBudgetUI') {
                            content.result = {
                                ...(content.result as Object),
                                purchasingUiProps: (content.result as {
                                    purchasingUiProps: string
                                }).purchasingUiProps ?? {
                                    success: updateSuccess,
                                    budget,
                                    campaignName,
                                    days,
                                    totalBudget,
                                }
                            };
                        }
                    }
                    return message;
                }),
                {
                    id: nanoid(),
                    role: 'assistant',
                    content: newMessage,
                    timestamp: new Date().toISOString()
                }
            ]
        });
    });

    return {
        purchasingUI: purchasing.value,
        newMessage: {
            id: nanoid(),
            display: newMessageStream.value,
        }
    }
}

async function confirmUpdateStatus(campaignName: string, status: string) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place
    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {
        campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0'
    }

    const updateStatus = createStreamableUI(
        <div className="inline-flex items-start gap-1 md:items-center">
            {spinner}
            <p className="mb-2">
                Setting the status for {campaignName} to {status}...
            </p>
        </div>
    );
    const systemMessage = createStreamableUI(null);
    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        const updateSuccess = await setCampaignStatus(
            campaignId,
            status
        )
        if (updateSuccess) {
            updateStatus.done(
                <div>
                    <p className="mb-2">
                        You have successfully set status for {campaignName}: {status}.
                    </p>
                </div>
            );
            systemMessage.done(
                <SystemMessage>
                    You have successfully set status for {campaignName}: {status}.
                </SystemMessage>
            );
        } else {
            updateStatus.done(
                <div>
                    <p className="mb-2 text-red-500">
                        Error: Failed to set the status for {campaignName}. Please try again later.
                    </p>
                </div>
            );
            systemMessage.done(
                <SystemMessage>
                    Error: Failed to set the status for {campaignName}. Please try again later.
                </SystemMessage>
            );
        }


    });
    return {
        updateStatusUI: updateStatus.value,
        newMessage: {
            id: nanoid(),
            display: systemMessage.value
        }
    }
}

async function confirmCreateAd(campaign: any, data: any, adset: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place
    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {
        campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0'
    }
    let adsetUpdate = {
        ...adset
    }
    if (!campaign.daily_budget) {
        const chatId = getChatIdFromUrl()?.toString() || '';
        const budget = await fetchChatCampaignBudget(chatId)
        if (budget.error) {
            adsetUpdate = {...adsetUpdate, daily_budget: 100}
        }
    }

    const systemMessage = createStreamableUI(null)
    const fbAdIdStream: undefined | ReturnType<typeof createStreamableValue<string>> = createStreamableValue()

    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        const response = await createCampaignAd(
            campaignId,
            data,
            adsetUpdate
        );

        if (response) {
            const id = response?.params?.id
            fbAdIdStream?.done(`${id}`)

            systemMessage.done(
                <SystemMessage>
                    You have successfully created a campaign ad with ID: {response?.params?.id}
                </SystemMessage>
            );

        } else {
            systemMessage.done(
                <SystemMessage>
                    Error: Failed to create campaign ad. Please try again later.
                </SystemMessage>
            );
        }

        aiState.done({
            ...aiState.get(),
        });
    });

    return {
        newMessage: {
            id: nanoid(),
            display: systemMessage.value
        },
        fbAdIdStream: fbAdIdStream.value
    }
}

async function updateCampaignInfo(campaignSummary: CampaignSummary) {
    'use server'

    const aiState = getMutableAIState<typeof AI>();

    aiState.done({
        ...aiState.get(),
        messages: [
            {
                id: 'campaign-info-data',
                role: 'system',
                content: `Campaign is connected, the knowledge base about current campaign information: ${JSON.stringify(campaignSummary)}`,
                timestamp: new Date().toISOString() 
            },
            ...aiState.get().messages.filter((message: Message) => message.id !== 'campaign-info-data' || message.role !== 'system'),
        ]
    });
}

async function syncMessages() {
    'use server'

    const aiState = getMutableAIState<typeof AI>();
    console.log('syncMessages', aiState.get().messages[0])
    aiState.done({
        ...aiState.get(),
    });
}

async function confirmUpdateAdset(toolCallId: string, adsetId: string, adset: any) {
  'use server'
  const aiState = getMutableAIState<typeof AI>();
  const chatId = getChatIdFromUrl()?.toString() || ''

  const budget = await fetchChatCampaignBudget(chatId)
  let adsetUpdate = { ...adset }
  if (budget.error) {
    adsetUpdate = { ...adsetUpdate, daily_budget: 100 }
  }

  const systemMessage = createStreamableUI(null);
  const responseStream = createStreamableValue<Adset | boolean>(false);

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000);

    const response = await updateAdset(adsetId, adsetUpdate);
    if (response.success) {
      const messages = aiState.get().messages;
      const lastMessage = messages.slice(-1)[0];
      if (lastMessage && lastMessage.id === toolCallId && lastMessage.role === 'tool') {
        const content = lastMessage.content[0];
        if (
          content.type === 'tool-result' &&
          content.toolName === 'showPlacementTargetingUI'
        ) {
          content.result = {
            ...(content.result as Object),
            targetingUiProps: (
            content.result as {
              targetingUiProps: object
            }
            ).targetingUiProps ?? {
              success: true,
              targeting: response?.data.targeting
            }
          }
        }
      }
      responseStream.done(response.data);
      aiState.done({
        ...aiState.get(),
        messages: [
          ...messages.slice(0, -1),
          lastMessage!
        ]
      })
      systemMessage.done(
        <SystemMessage>
          You have successfully updated placement targeting
        </SystemMessage>
      );
    } else {
      responseStream.done(false);
      systemMessage.done(
        <SystemErrorMessage>
          Error: {response.data?.detail?.error?.error_user_msg || "Failed to updated placement targeting. Please try again later."}
        </SystemErrorMessage>
      );
    }
  })

  return {
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    },
    response: responseStream.value
  }
}

async function submitUserMessage(content: string, contentImages?: Array<TextPart | ImagePart>, isSilent?: boolean) {
    'use server'

    const aiState = getMutableAIState<typeof AI>();
    const chatId = getChatIdFromUrl()?.toString() || '';

    let campaignId = '';
    try {
        campaignId = (await getCampaignIdFromUrl())?.toString() || '';
    } catch (error) {
        // Error handling if necessary
    }

    let extraDetailsFinalText = '';

    try {
        if (chatId) {
            const defaultExtraDetailsResult = await fetchUserDefaultExtraDetails();

            if (defaultExtraDetailsResult) {
                extraDetailsFinalText += `Some important contextual information about this specific user can be seen here: ${defaultExtraDetailsResult}`;
            }
        }

        if (campaignId) {
            const extraDetailsResult = await fetchFbCampaignExtraDetailsForChat(campaignId);

            if (extraDetailsResult.success && extraDetailsResult.extraDetails) {
                if (extraDetailsFinalText) {
                    extraDetailsFinalText += '\n\n';
                }
                extraDetailsFinalText += `Some important contextual information about this specific campaign can be seen here: ${extraDetailsResult.extraDetails}`;
            }
        }
    } catch (error) {
        console.error('Error fetching extra details:', error);
    }
    const session = (await auth()) as Session
    await checkNewChat(chatId, aiState.get().messages, session);
    if (!isSilent) {
        aiState.update({
            ...aiState.get(),
            messages: [
                ...aiState.get().messages,
                {
                    id: nanoid(),
                    role: 'user',
                    content: contentImages?.length ? contentImages : content,
                    timestamp: new Date().toISOString(),
                }
            ]
        })
    }

    let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
    let textNode: undefined | React.ReactNode

    const result = await streamUI({
        model: openai('gpt-4o'),
        initial: <SpinnerMessage/>,
        system: `
   <define:user_flow id="campaign_creation_flow">
    <step>Ask the user if they want to run a lead campaign, a campaign to recruit employees, or a retargeting campaign</step>
    <step>Wait for the user's response</step>
</define:user_flow>

<define:user_flow id="survey_steps">
    <step>Ask: "Do you want to give your campaign a name or should I choose one for you?"</step>
    <step>Wait for the user's response</step>
    <step>Call \`create_campaign\` with [client's answer] or [your suggestion] as the campaign name</step>
    <step>Ask: "How much do you want to spend on your campaign daily? Ideally, spend at least €300 a month to maximize Facebook ads' potential."</step>
    <step>Wait for the user's response</step>
    <step>Call \`show_ad_budget_ui\`</step>
    <step>Guide: 'Confirm the ad budget for your campaign by clicking "Set Ad Budget". You can change this at any given point to adjust your campaign.'</step>
    <step>Ask: "In what geographical area do you want to advertise?"</step>
    <step>Wait for the user's response</step>
    <step>Acknowledge the area</step>
</define:user_flow>

<define:user_flow id="lead_campaign_targeting">
    <step>Ask: "Can you broadly describe who you want to reach with the campaign? I will search for targeting filters that are available in the Campaign targeting Settings and match them based on your descriptions."</step>
    <step>Wait for the user's response</step>
</define:user_flow>

<define:user_flow id="recruiting_campaign_targeting">
    <step>Explain: "Due to anti-discrimination guidelines, this campaign falls under a special ad category."</step>
    <step>Ask: "Can you broadly describe what you look for in an employee and what job you are looking to fill? What interests should your ideal employee have? I will search for interest filters that are available in the Campaign targeting Settings and match them based on your descriptions."</step>
    <step>Wait for the user's response</step>
</define:user_flow>

<define:user_flow id="retargeting_campaign_flow">
    <step>Inform: "I recommend creating a custom audience from a video ad and then using that custom audience to create a lookalike audience. I will take care of creating those for you, but this will take up to 48 hours until ready."</step>
</define:user_flow>

<define:user_flow id="ad_placement_flow">
    <step>Suggest suitable placements based on previous answers</step>
    <step>Ask: "I suggest we place the ad in [placements] because [reason]. Do you agree with this placement?"</step>
    <step>Wait for the user's feedback</step>
    <step>Adjust placements based on user feedback</step>
</define:user_flow>

<define:user_flow id="ad_creatives_flow">
    <step>Instruct: "Please upload your ad images by clicking on the plus button. I will create ad text suggestions for you."</step>
    <step>If the user uploads images, proceed to handle image uploads</step>
    <step>If the user asks about creating an ad image, inform: "Currently, that is not possible, but the Reeply AI team is working hard to make it available soon."</step>
    <step>If the user uploads ad videos, ask: "Thank you for uploading the video. Could you describe what is in the video or what it is about, in a few sentences? Since I cannot see what is in the video."</step>
    <step>After the user provides a video description, ALWAYS call \`show_suggestion_video_ad_text\` to suggest ad texts for the video based on the description</step>
</define:user_flow>

<define:user_flow id="ad_texts_flow">
    <step>Ask: "Do you have an ad text, or should I suggest one?"</step>
    <step>Wait for the user's response</step>
    <step>ALWAYS call \`show_suggestion_ad_text\` to show the ad text selection UI and let the user choose or input their ad text</step>
    <step>Guide: 'You can adjust my ad text suggestions or approve them. After approving, the image as well as the ad text will be added to your campaign, so make sure that you are all set with ad image and ad text!'</step>
    <step>Confirm the final text before proceeding</step>
</define:user_flow>

<define:user_flow id="lead_questionnaire_flow">
    <step>Ask: "Do you want to ask for contact details only, or also pre-qualify leads with additional questions such as [examples]? I can help with the creation, or you can provide your ideas."</step>
    <step>Wait for the user's response</step>
    <step>Confirm each additional question with the user</step>
</define:user_flow>

<define:user_flow id="finalization_flow">
    <step>Inform: "It seems like I'm done with my consultation for today. Our team will call you back within 48 hours. Meanwhile, I will set up your ad, and the Reeply AI experts will review it thoroughly to make sure everything is alright. It will take around 24 hours to get the ad live. Thank you for using Reeply AI."</step>
</define:user_flow>

<on:user_ask refers_to="create a campaign">
    <action:run_flow id="campaign_creation_flow" />
</on:user_ask>

<on:user_response refers_to="lead campaign">
    <action:run_flow id="survey_steps" />
    <action:run_flow id="lead_campaign_targeting" />
    <action:run_flow id="ad_placement_flow" />
    <action:run_flow id="ad_creatives_flow" />
    <action:run_flow id="ad_texts_flow" />
    <action:run_flow id="lead_questionnaire_flow" />
    <action:run_flow id="finalization_flow" />
</on:user_response>

<on:user_response refers_to="recruiting campaign">
    <action:run_flow id="survey_steps" />
    <action:run_flow id="recruiting_campaign_targeting" />
    <action:run_flow id="ad_placement_flow" />
    <action:run_flow id="ad_creatives_flow" />
    <action:run_flow id="ad_texts_flow" />
    <action:run_flow id="finalization_flow" />
</on:user_response>

<on:user_response refers_to="retargeting campaign">
    <action:run_flow id="survey_steps" />
    <action:run_flow id="retargeting_campaign_flow" />
    <action:run_flow id="ad_placement_flow" />
    <action:run_flow id="ad_creatives_flow" />
    <action:run_flow id="ad_texts_flow" />
    <action:run_flow id="finalization_flow" />
</on:user_response>

<on:user_upload type="image">
    <action:ask>"Would you like me to generate ad text examples for these images?"</action:ask>
    <action:wait_for_confirmation />
</on:user_upload>

<on:user_confirmation refers_to="yes">
    <action:call>showSuggestionAdText with images=[uploaded images]</action:call>
</on:user_confirmation>

<on:user_response refers_to="status update">
    <action:call>showUpdateStatusChampaign</action:call>
</on:user_response>

<!-- Additional Guidelines -->

<on:user_request refers_to="campaign result|campaign status|campaign budget|placement targeting" campaign_connected="false">
    <action:call>show_campaign_connection_ui</action:call>
</on:user_request>

<on:user_request refers_to="placement targeting" campaign_budget_set="false">
    <action:inform>"The campaign budget should be set first."</action:inform>
    <action:ask>"Would you like to see a UI to set the campaign budget?"</action:ask>
</on:user_request>

<on:user_request refers_to="change ad budget">
    <action:ask>"How much would you like to change the ad budget to?"</action:ask>
</on:user_request>

<on:user_response refers_to="budget amount">
    <action:call>show_ad_budget_ui</action:call>
</on:user_response>

<on:user_request refers_to="campaign results">
    <action:call>get_campaign_results</action:call>
    <action:guide>'Do you want me to analyze this for you or discuss any of the results?'</action:guide>
</on:user_request>

<on:user_request refers_to="provide ad texts">
    <action:call>show_suggestion_ad_text</action:call>
</on:user_request>

<on:user_request refers_to="change campaign status|pause campaign">
    <action:call>showUpdateStatusChampaign</action:call>
</on:user_request>

<on:user_request refers_to="placement targeting">
    <action:call>show_placement_targeting_ui</action:call>
</on:user_request>

<on:user_request refers_to="specific task">
    <action:inform>"I'm sorry, I'm a demo and cannot perform that action."</action:inform>
</on:user_request>

<!-- Language Handling -->

<on:user_speaks_language language="any">
    <action:set_language language="[User's language]" formality="avoid being too formal" />
</on:user_speaks_language>

    ${extraDetailsFinalText}`,

        messages: [
            ...aiState.get().messages.map((message: any) => ({
                role: message.role,
                content: message.content,
                name: message.name
            }))
        ],
        text: ({content, done, delta}) => {
            if (!textStream) {
                textStream = createStreamableValue('')
                textNode = <BotMessage content={textStream.value}/>
            }
            if (done) {
                textStream.done();
                aiState.done({
                    ...aiState.get(),
                    messages: [
                        ...aiState.get().messages.map((message: any) => ({
                            id: message.id,
                            role: message.role,
                            content: message.content,
                            name: message.name,
                            timestamp: message.timestamp
                        })),
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content,
                            timestamp: new Date().toISOString()
                        }
                    ]
                });
            } else {
                textStream.update(delta)
            }

            return textNode
        },
        tools: {
            // listAds: {
            //     description: 'List three imaginary ads that are currently running.',
            //     parameters: z.object({
            //         stocks: z.array(
            //             z.object({
            //                 symbol: z.string().describe('The name of the campaign'),
            //                 price: z.number().describe('The daily ad budget of the campaign'),
            //                 delta: z.number().describe('The change of the daily ad budget')
            //             })
            //         )
            //     }),
            //     generate: async function* ({stocks}) {
            //         yield (
            //             <BotCard>
            //                 <StocksSkeleton/>
            //             </BotCard>
            //         )

            //         await sleep(1000)

            //         const toolCallId = nanoid()

            //         aiState.done({
            //             ...aiState.get(),
            //             messages: [
            //                 ...aiState.get().messages,
            //                 {
            //                     id: nanoid(),
            //                     role: 'assistant',
            //                     content: [
            //                         {
            //                             type: 'tool-call',
            //                             toolName: 'listAds',
            //                             toolCallId,
            //                             args: {stocks}
            //                         }
            //                     ]
            //                 },
            //                 {
            //                     id: nanoid(),
            //                     role: 'tool',
            //                     content: [
            //                         {
            //                             type: 'tool-result',
            //                             toolName: 'listAds',
            //                             toolCallId,
            //                             result: stocks
            //                         }
            //                     ]
            //                 }
            //             ]
            //         })

            //         return (
            //             <BotCard>
            //                 <Stocks props={stocks}/>
            //             </BotCard>
            //         )
            //     }
            // },
            getCampaignResults: {
                description:
                    'Get the current campaign results of a given digital marketing campaign from this user. Use this to show the current daily ad spent to the user.',
                parameters: z.object({
                    campaignId: z.string().describe('The id of the campaign.'),
                    guideForUser: z.string().optional().describe('This is the guide for user about this component, this is optional'),
                }),
                generate: async function* ({campaignId, guideForUser}) {
                    yield (
                        <BotCard>
                            <StockSkeleton/>
                        </BotCard>
                    )

                    await sleep(1000)

                    const toolCallId = nanoid()

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'getCampaignResults',
                                        toolCallId,
                                        args: {campaignId, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'getCampaignResults',
                                        toolCallId,
                                        result: {campaignId, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });

                    return (
                        <>
                            <BotCard>
                                <Stock campaignId={campaignId} isActive/>
                            </BotCard>
                            <div className="my-4">
                                {guideForUser ?? ''}
                            </div>
                        </>
                    )
                }
            },
            getCampaignImages: {
                description:
                    'Get the current images of campaign of a given digital marketing campaign from this user. Use this to show the campaign images to the user.',
                parameters: z.object({}),
                generate: async function* ({}) {
                    yield (
                        <BotCard>
                            <StockSkeleton/>
                        </BotCard>
                    )

                    await sleep(1000)

                    const toolCallId = nanoid()

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'getCampaignImages',
                                        toolCallId,
                                        args: {}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'getCampaignImages',
                                        toolCallId,
                                        result: {}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });


                    return (
                        <BotCard>
                            <ChatImage/>
                        </BotCard>
                    )
                }
            },
            showAdBudgetUI: {
                description:
                    'Show Facebook Ad Campaign name and the UI to set ad budget. Use this if the user wants to change his ad budget.',
                parameters: z.object({
                    symbol: z
                        .string()
                        .describe(
                            'The name of the digital marketing campaign. e.g. Recruiting Campaign Chef Cook.'
                        ),
                    price: z.number().describe('The current daily amount of ad budget spent.'),
                    numberOfShares: z
                        .number()
                        .optional()
                        .describe(
                            'The **daily ad spend** for a campaign that a user wants to invest. Can be optional if the user did not specify it.'
                        ),
                    guideForUser: z.string().optional().describe('This is the guide for user about this component, this is optional'),
                }),
                generate: async function* ({symbol, price, numberOfShares, guideForUser}) {
                    const toolCallId = nanoid()
                    const initialBudget = numberOfShares || price

                    if (initialBudget <= 0 || initialBudget > 1000) {
                        aiState.done({
                            ...aiState.get(),
                            messages: [
                                ...aiState.get().messages,
                                {
                                    id: nanoid(),
                                    role: 'assistant',
                                    content: [
                                        {
                                            type: 'tool-call',
                                            toolName: 'showAdBudgetUI',
                                            toolCallId,
                                            args: {symbol, price, numberOfShares: initialBudget, guideForUser}
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                },
                                {
                                    id: nanoid(),
                                    role: 'tool',
                                    content: [
                                        {
                                            type: 'tool-result',
                                            toolName: 'showAdBudgetUI',
                                            toolCallId,
                                            result: {
                                                symbol,
                                                price,
                                                numberOfShares: initialBudget,
                                                status: 'expired',
                                                guideForUser
                                            }
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                },
                                {
                                    id: nanoid(),
                                    role: 'system',
                                    content: `[User has selected an invalid amount]`,
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        });


                        return <BotMessage content={'Invalid amount'}/>
                    } else {
                        aiState.done({
                            ...aiState.get(),
                            messages: [
                                ...aiState.get().messages,
                                {
                                    id: nanoid(),
                                    role: 'assistant',
                                    content: [
                                        {
                                            type: 'tool-call',
                                            toolName: 'showAdBudgetUI',
                                            toolCallId,
                                            args: {symbol, price, numberOfShares: initialBudget, guideForUser}
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                },
                                {
                                    id: nanoid(),
                                    role: 'tool',
                                    content: [
                                        {
                                            type: 'tool-result',
                                            toolName: 'showAdBudgetUI',
                                            toolCallId,
                                            result: {
                                                symbol,
                                                price,
                                                numberOfShares: initialBudget,
                                                guideForUser
                                            }
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        });

                        return (
                            <>
                                <BotCard>
                                    <Purchase
                                        props={{
                                            symbol,
                                            price: +price,
                                            initialBudget: initialBudget,
                                            status: 'requires_action'
                                        }}
                                    />
                                </BotCard>
                                <div className="my-4">
                                    {guideForUser ?? ''}
                                </div>
                            </>
                        )
                    }
                }
            },
            getEvents: {
                description:
                    'List Tips which provide helpful information to users on how they could improve their campaigns.',
                parameters: z.object({
                    events: z.array(
                        z.object({

                            headline: z.string().describe('The headline of the event'),
                            description: z.string().describe('The description of the event')
                        })
                    )
                }),
                generate: async function* ({events}) {
                    yield (
                        <BotCard>
                            <EventsSkeleton/>
                        </BotCard>
                    )

                    await sleep(1000)

                    const toolCallId = nanoid()

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'getEvents',
                                        toolCallId,
                                        args: {events}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'getEvents',
                                        toolCallId,
                                        result: events
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });


                    return (
                        <BotCard>
                            <Events props={events}/>
                        </BotCard>
                    )
                }
            },
            showSuggestionAdText: {
                description: 'Show UI to select or input ad text for each image a campaign.',
                parameters: z.object({
                    campaignName: z.string().describe('The name of the campaign'),
                    images: z.array(z.object({
                            suggestedTexts: z.array(z.object({
                                id: z.number().describe('This is timestamp of current time'),
                                image: z.string().describe('The link of the image to display'),
                                date: z.string(),
                                text: z.string(),
                                headline: z.string().optional().describe('The headline of the ad to display'),
                            })).describe('List of suggested ad texts')
                        })
                    ).describe('List of images to display'),
                    guideForUser: z.string().optional().describe('This is the guide for user about this component, this is optional')
                }),
                generate: async function* ({campaignName, images = [], guideForUser}) {
                    yield (
                        <BotCard>
                            <AdTextSelectionSkeleton/>
                        </BotCard>
                    );

                    await sleep(1000);

                    const toolCallId = nanoid();

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showSuggestionAdText',
                                        toolCallId,
                                        args: {campaignName, images, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showSuggestionAdText',
                                        toolCallId,
                                        result: {campaignName, images, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });

                    return (
                        <>
                            <BotCard>
                                <AdTextSuggestion props={images}/>
                            </BotCard>
                            <div className="my-4">
                                {guideForUser ?? ''}
                            </div>
                        </>
                    );
                }
            },
            showSuggestionVideoAdText: {
                description: 'Show UI to select or input ad text for each video a campaign.',
                parameters: z.object({
                    campaignName: z.string().describe('The name of the campaign'),
                    videos: z.array(z.object({
                        suggestedTexts: z.array(z.object({
                            id: z.number().describe('This is timestamp of current time'),
                            video_id: z.string().describe('This is ID of this video'),
                            video: z.string().describe('The video link of this video'),
                            thumbnail: z.string().describe('The thumbnail link of this video'),
                            date: z.string(),
                            text: z.string(),
                            headline: z.string().describe('The headline of the ad to display'),
                        })).describe('List of suggested video ad texts')
                     })).describe('List of videos to display'),
                     guideForUser: z.string().optional().describe('This is the guide for user about this component, this is optional')
                }),
                generate: async function* ({campaignName, videos = [], guideForUser}) {
                    yield (
                        <BotCard>
                            <AdTextSelectionSkeleton/>
                        </BotCard>
                    );

                    await sleep(1000);

                    const toolCallId = nanoid();

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showVideoAdTextSuggestion',
                                        toolCallId,
                                        args: {campaignName, videos, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showVideoAdTextSuggestion',
                                        toolCallId,
                                        result: {campaignName, videos, guideForUser}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });
                    return (
                        <BotCard>
                            <VideoAdTextSuggestion videos={videos}/>
                            <div className="my-4">
                                {guideForUser ?? ''}
                            </div>
                        </BotCard>
                    );
                }
            },
            showUpdateStatusCampaign: {
                description: 'Show UI  to update status of the campaign.',
                parameters: z.object({
                    campaignName: z.string().describe('The name of the campaign'),
                    status: z.string().describe('The current status of the campaign'),
                }),
                generate: async function* ({campaignName, status}) {
                    yield (
                        <BotCard>
                            <AdTextSelectionSkeleton/>
                        </BotCard>
                    );

                    await sleep(1000);

                    const toolCallId = nanoid();

                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showUpdateStatusCampaign',
                                        toolCallId,
                                        args: {campaignName, status}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: nanoid(),
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showUpdateStatusCampaign',
                                        toolCallId,
                                        result: {campaignName, status}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });


                    return (
                        <BotCard>
                            <CampaignStatus props={{toolCallId, campaignName, status}}/>
                        </BotCard>
                    )
                }
            },
            showCampaignNameUpdateUI: {
                description: 'Show a notification that the name of Facebook Ad Campaign is updated. Use this when the user wants to change campaign name. The parameter questionForBudget is optional. It is used only in step 1.',
                parameters: z.object({
                    campaignName: z.string().describe('The name of the campaign'),
                    questionForBudget: z.string().describe('The question for the budget with step 2, this is optional'),
                }),
                generate: async function* ({campaignName, questionForBudget}) {
                    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place
                    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {
                        campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0'
                    }
                    console.log('why is campaign name changed?', campaignName)
                    await updateCampaign(campaignId, {name: campaignName})
                    await updateChatTitle(aiState.get().chatId, campaignName)
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showCampaignNameUpdateUI',
                                        toolCallId,
                                        args: {campaignName, campaignId, questionForBudget}
                                    }
                                ],
                                timestamp
                            },
                            {
                                id: toolCallId,
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showCampaignNameUpdateUI',
                                        toolCallId,
                                        result: {campaignName, campaignId, questionForBudget}
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    return (
                        <BotCard>
                            <p className="mb-2 last:mb-0">{`Alright, I will update campaign name as "${campaignName}".`}</p>
                            {!!questionForBudget && <p className="mb-2 last:mb-0">{questionForBudget}</p>}
                            <InjectCampaign campaignId={campaignId} />
                            <RefreshChatTitle campaignName={campaignName} campaignId={campaignId}/>
                        </BotCard>
                    )
                }
            },
            createCampaign: {
                description: 'Show a notification that the name of Facebook Ad Campaign is updated. Use this when the user wants to change campaign name. The parameter questionForBudget is optional. It is used only in step 1.',
                parameters: z.object({
                    campaignName: z.string().describe('The name of the campaign'),
                    questionForBudget: z.string().describe('The question for the budget with step 2, this is optional'),
                }),
                generate: async function* ({campaignName, questionForBudget}) {
                    const response = await createCampaign({
                      objective: 'OUTCOME_LEADS',
                      special_ad_categories: ['NONE'],
                      name: campaignName,
                      status: 'PAUSED',
                    })
                    let success = !!response.ok
                    if (success) {
                        const { id } = await response.json()
                        const result = await updateChat(aiState.get().chatId, {
                            title: campaignName,
                            fbCampaignId: id
                        })
                        success = success && !!result.success
                        campaignId = id
                    } else {
                        console.error('Error create campaign:', {
                            status: response.status,
                            statusText: response.statusText
                        })
                    }
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'createCampaign',
                                        toolCallId,
                                        args: {success, campaignName, campaignId, questionForBudget}
                                    }
                                ],
                                timestamp
                            },
                            {
                                id: toolCallId,
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'createCampaign',
                                        toolCallId,
                                        result: {success, campaignName, campaignId, questionForBudget}
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    return success ? (
                        <BotCard>
                            <p className="mb-2 last:mb-0">{`I created a campaign named "${campaignName}".`}</p>
                            {!!questionForBudget && <p className="mb-2 last:mb-0">{questionForBudget}</p>}
                            <InjectCampaign campaignId={campaignId} />
                            <RefreshChatTitle campaignName={campaignName} campaignId={campaignId}/>
                        </BotCard>
                    ) : (
                        <BotCard>
                            <p className="mb-2 last:mb-0">Campaign creation failed, please try again later.</p>
                        </BotCard>
                    )
                }
            },
            showCampaignConnectionUI: {
                description: 'Show a UI to connect a campaign to the chat.',
                parameters: z.object({}),
                generate: async function* ({}) {
                    console.log('tool call showCampaignConnectionUI')
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showCampaignConnectionUI',
                                        toolCallId,
                                        args: {}
                                    }
                                ],
                                timestamp
                            },
                            {
                                id: toolCallId,
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showCampaignConnectionUI',
                                        toolCallId,
                                        result: {}
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    return (
                        <BotCard>
                            <ConnectCampaign />
                        </BotCard>
                    )
                }
            },
            showPlacementTargetingUI: {
                description: 'Show a UI to set placement targeting of the campaign',
                parameters: z.object({}),
                generate: async function* ({}) {
                    console.log('tool call showPlacementTargetingUI')
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showPlacementTargetingUI',
                                        toolCallId,
                                        args: {}
                                    }
                                ],
                                timestamp
                            },
                            {
                                id: toolCallId,
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showPlacementTargetingUI',
                                        toolCallId,
                                        result: {}
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    return (
                        <BotCard>
                            <PlacementTargeting toolCallId={toolCallId}/>
                        </BotCard>
                    )
                }
            }
        }
    });
    return {
        id: nanoid(),
        display: result.value
    }
}

export type AIState = {
    chatId: string
    title: string
    messages: Message[]
}

export type UIState = {
    id: string
    display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
    actions: {
        submitUserMessage,
        confirmPurchase,
        confirmUpdateStatus,
        confirmCreateAd,
        updateCampaignInfo,
        syncMessages,
        confirmUpdateAdset,
    },
    initialUIState: [],
    initialAIState: {chatId: nanoid(), title: '', messages: []},
    onGetUIState: async () => {
        'use server'

        const session = await auth()

        if (session && session.user) {
            const aiState = getAIState() as Chat

            if (aiState) {
                return getUIStateFromAIState(aiState)
            }
        } else {
            return
        }
    },
    onSetAIState: async ({state}) => {
        'use server'

        const session = await auth()

        if (session && session.user) {
            const {chatId, title, messages} = state

            const createdAt = new Date()
            const userId = session.user.id as string
            const path = `/chat/${chatId}`

            const firstMessageContent = (Array.isArray(messages[0].content) ? (messages[0].content[0] as TextPart).text : messages[0].content) as string

            const defaultTitle = firstMessageContent.substring(0, 100)

            const chat: Chat = {
                id: chatId,
                title: title || defaultTitle,
                userId,
                createdAt,
                messages,
                path
            }

            await saveChat(chat)
        } else {
            return
        }
    }
})

function isToolResultArray(content: string | ToolResult[]): content is ToolResult[] {
    return Array.isArray(content);
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
                            // case 'listAds':
                            //     return (
                            //         <BotCard key={tool.toolCallId}>
                            //             <Stocks props={tool.result}/>
                            //         </BotCard>
                            //     );
                            case 'showStockPrice':
                            case 'getCampaignResults':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <Stock campaignId={tool.result.campaignId}/>
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
                                        <p className="mb-2 last:mb-0">Campaign creation failed, please try again later.</p>
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
                            case 'showPlacementTargetingUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <PlacementTargeting {...tool.result} toolCallId={tool.toolCallId} />
                                    </BotCard>
                                )
                            default:
                                return null;
                        }
                    })
                ) : message.role === 'user' ? (
                    <UserMessage
                        userContent={message.content}>{(Array.isArray(message.content) ? (message.content[0] as TextPart).text : message.content) as string}</UserMessage>
                ) : message.role === 'assistant' &&
                typeof message.content === 'string' ? (
                    <BotMessage content={message.content}/>
                ) : null
        }))
        .filter((message: { id: string, display: any }) => Boolean(message.display))
}
