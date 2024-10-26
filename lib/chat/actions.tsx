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
import {Adset, AdText, LeadgenFrom, Chat, Message, Session} from '@/lib/types';
import {auth} from '@/auth'
import {setDailyCampaignBudget} from '@/lib/api/fasty-bot/set-daily-campaign-budget';
import {setCampaignStatus} from '@/lib/api/fasty-bot/set-campaign-status';
import {createCampaignAd} from '@/lib/api/fasty-bot/create-ad';
import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'
import {CampaignSummary} from '@/lib/api/fasty-bot/get-campaign-summary'
import {updateCampaign} from '@/lib/api/fasty-bot/update-campaign';
import {createLeadgenForm} from '@/lib/api/fasty-bot/create-leadgen-form';
import {updateAdset} from '@/lib/api/fasty-bot/update-adset';
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {sendAdminNotification} from '@/lib/api/fasty-bot/send-admin-notification'
import {ConnectCampaign} from '@/components/connect-campaign'
import {PlacementTargeting} from '@/components/placement-targeting';
import {ConnectAdset} from '@/components/connect-adset'

import FormBuilder from '@/components/form-builder';
import {sendSupervisedTaskMail}  from '@/lib/api/fasty-bot/send-supervised-task-mail';
import SupervisedTaskMessage from '@/components/supervised-task-message'
import {getBaseUrl} from "@/lib/helpers/vercel/get-base-url"
import adBudgetModule from "@/lib/ui-magic/modules/adBudgetModule";
import targetingModule from "@/lib/ui-magic/modules/targetingModule";

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

        const newMessage = 'Would you like to continue?';

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

async function confirmCreateLeadgenForm(toolCallId: string, data: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    const systemMessage = createStreamableUI(null);
    const responseStream = createStreamableValue<LeadgenFrom | boolean>(false);
  
    runAsyncFnWithoutBlocking(async () => {
      await sleep(1000);
  
      const response = await createLeadgenForm(data);
      if (response) {
        const messages = aiState.get().messages;
        const lastMessage = messages.slice(-1)[0];
        if (lastMessage && lastMessage.id === toolCallId && lastMessage.role === 'tool') {
          const content = lastMessage.content[0];
          if (
            content.type === 'tool-result' &&
            content.toolName === 'showFormBuilder'
          ) {
            content.result = {
              ...(content.result as Object),
              formBuilderUiProps: (
              content.result as {
                formBuilderUiProps: object
              }
              ).formBuilderUiProps ?? {
                success: true,
                formBuilder: {...data, ...response}
              }
            }
          }
        }
        responseStream.done(response);
        aiState.done({
          ...aiState.get(),
          messages: [
            ...messages.slice(0, -1),
            lastMessage!
          ]
        })
        systemMessage.done(
          <SystemMessage>
            You have successfully create leadgen form
          </SystemMessage>
        );
      } else {
        responseStream.done(false);
        systemMessage.done(
          <SystemErrorMessage>
            Error: {response?.detail?.error?.error_user_msg || "Failed to create leadgen form. Please try again later."}
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
        system: `<?xml version="1.0" encoding="UTF-8"?>
                <reeplyAI version="1.0">
              <identity>
                <name>Reeply AI</name>
                <role>Facebook Ads Assistant</role>
                <worksWith>Experienced human team</worksWith>
              </identity>
            
              <confidentiality>
                <notice>Content reviewed by marketing team for follow-up</notice>
              </confidentiality>
            
              <communication>
                <style>
                  <rule>Keep messages short and easy to understand</rule>
                  <rule>Follow steps sequentially - no skipping or combining</rule>
                  <rule>Match user's language (use informal "Du" for German)</rule>
                </style>
              </communication>
            
              <workflow>
                <initialQuestion>
                  Would you like to create a lead campaign, recruitment campaign, or retargeting campaign?
                </initialQuestion>
            
                <steps>
                  <step id="1">
                    <question>Do you want to give your campaign a name or should I choose one for you?</question>
                    <action>
                      <call>create_campaign</call>
                      <params>
                        <param>client_answer || suggestion</param>
                        <param type="questionForBudget">step2.question</param>
                      </params>
                    </action>
                  </step>
            
                  <step id="2">
                    <question>How much do you want to spend on your campaign daily? (Recommended: €300/month minimum)</question>
                    <action>
                      <call>show_ad_budget_ui</call>
                      <guide>Confirm the ad budget for your campaign by clicking "Set Ad Budget". You can change this at any given point.</guide>
                    </action>
                    <followUp>In what geographical area do you want to advertise?</followUp>
                  </step>
            
                  <step id="3">
                    <targeting>
                      <campaignType id="recruiting">
                        <notice>Special ad category due to anti-discrimination guidelines</notice>
                        <question>Can you broadly describe what you look for in an employee and what job you're filling? What interests should your ideal employee have?</question>
                      </campaignType>
            
                      <campaignType id="lead">
                        <question>Can you broadly describe who you want to reach with the campaign?</question>
                      </campaignType>
            
                      <campaignType id="retargeting">
                        <recommendation>
                          Create custom audience from video ad, then create lookalike audience.
                          Will take up to 48 hours to process.
                        </recommendation>
                      </campaignType>
            
                      <filterRules>
                        <rule>Select 1-5 filters from approved list</rule>
                        <rule>For country-level targeting, use up to 5 filters narrowed by 1-5 additional filters</rule>
                      </filterRules>
                    </targeting>
                  </step>
            
                  <step id="4">
                    <adCreatives>
                      <images>
                        <instruction>Please upload your ad images by clicking on the plus button. I will create ad text suggestions for you.</instruction>
                        <noCreationNotice>Image creation not currently available but coming soon.</noCreationNotice>
                      </images>
                      <videos>
                        <onUpload>Thank you for uploading the video. Could you describe what is in the video or what it is about, in a few sentences?</onUpload>
                        <action>
                          <call>show_suggestion_video_ad_text</call>
                        </action>
                      </videos>
                    </adCreatives>
                  </step>
            
                  <step id="5">
                    <question>Do you have an ad text, or should I suggest one?</question>
                    <adTextGuidelines>
                      <format>Create 3 versions: Professional, Emoji-rich, Conversational</format>
                      <length>2-3 sentences minimum per version</length>
                      <requirements>
                        <requirement>Include relevant emojis in Emoji version</requirement>
                        <requirement>Vary length and style between versions</requirement>
                        <requirement>Set headline for each version</requirement>
                      </requirements>
                    </adTextGuidelines>
                    <actions>
                      <action>
                        <call>show_suggestion_ad_text</call>
                        <guide>You can adjust my ad text suggestions or approve them. After approving, the image and ad text will be added to your campaign.</guide>
                      </action>
                      <action>
                        <call>showUpdateStatusChampaign</call>
                      </action>
                    </actions>
                  </step>
            
                  <step id="6">
                    <question>Do you want to ask for contact details only, or also pre-qualify leads with additional questions?</question>
                  </step>
            
                  <step id="7">
                    <completion>
                      It seems like I'm done with my consultation for today. Our team will call you back within 48 hours. Meanwhile, I will set up your ad, and the Reeply AI experts will review it thoroughly to make sure everything is alright. It will take around 24 hours to get the ad live. Thank you for using Reeply AI.
                    </completion>
                  </step>
                </steps>
              </workflow>
            
              <tools>
                <tool id="campaign_connection">
                  <trigger>Requests for campaign results/status/budget/placement without connection</trigger>
                  <action>show_campaign_connection_ui</action>
                </tool>
            
                <tool id="budget_management">
                  <trigger>Budget change request for connected campaign</trigger>
                  <sequence>
                    <step>Confirm desired amount</step>
                    <step>
                      <call>show_ad_budget_ui</call>
                    </step>
                  </sequence>
                </tool>
            
                <tool id="campaign_results">
                  <trigger>Results request</trigger>
                  <action>
                    <call>get_campaign_results</call>
                    <guide>Do you want me to analyze this for you or discuss any of the results?</guide>
                  </action>
                </tool>
            
                <tool id="ad_text">
                  <trigger>Ad text creation/suggestion</trigger>
                  <action>
                    <call>show_suggestion_ad_text</call>
                  </action>
                </tool>
            
                <tool id="campaign_status">
                  <trigger>Status update request</trigger>
                  <action>
                    <call>showUpdateStatusChampaign</call>
                  </action>
                </tool>
            
                <tool id="placement">
                  <trigger>Placement targeting request</trigger>
                  <action>
                    <call>show_placement_targeting_ui</call>
                  </action>
                </tool>
            
                <tool id="form">
                  <trigger>Form building request</trigger>
                  <action>
                    <call>show_form_builder</call>
                  </action>
                </tool>
              </tools>
            
              <targetingDatabase>
                <!-- Note: The full targeting list would be included here but is omitted for brevity -->
                <category name="Demographics">
                  <group name="Education">
                    <options>
                      <option>At high school</option>
                      <option>At university</option>
                      <!-- etc -->
                    </options>
                  </group>
                  <!-- Other demographic groups -->
                </category>
                <!-- Other categories -->
              </targetingDatabase>
            </reeplyAI>

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
                description: adBudgetModule.description,
                parameters: adBudgetModule.parameters,
                generate: async function* ({ symbol, price, numberOfShares, guideForUser }) {
                    const toolCallId = nanoid();
                    const initialBudget = numberOfShares || price;

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
                                            args: { symbol, price, numberOfShares: initialBudget, guideForUser }
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

                        return await adBudgetModule.component({ symbol, price, numberOfShares, guideForUser });
                    }

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
                                        args: { symbol, price, numberOfShares: initialBudget, guideForUser }
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

                    return await adBudgetModule.component({ symbol, price, numberOfShares, guideForUser });
                }
            }, analyzeCampaignTargeting: {
                description: targetingModule.description,
                parameters: targetingModule.parameters,
                generate: async function* ({ campaignType, userDescription }) {
                    const toolCallId = nanoid();

                    // Initial loading state
                    yield (
                        <BotCard>
                            <SpinnerMessage />
                            <p>Analyzing campaign for targeting suggestions...</p>
                        </BotCard>
                    );

                    await sleep(1000);

                    // Update AI state
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
                                        toolName: 'analyzeCampaignTargeting',
                                        toolCallId,
                                        args: { campaignType, userDescription }
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });

                    // Get result from module
                    const result = await targetingModule.component({
                        campaignType,
                        userDescription
                    });

                    return result;
                }
            },
            showFormBuilder: {
                description:
                    'Show form builder',
                parameters: z.object({}),
                generate: async function* () {
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
                                        toolName: 'showFormBuilder',
                                        toolCallId,
                                        args: {}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                            {
                                id: toolCallId,
                                role: 'tool',
                                content: [
                                    {
                                        type: 'tool-result',
                                        toolName: 'showFormBuilder',
                                        toolCallId,
                                        result: {}
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            },
                        ]
                    });

                    return (
                        <BotCard>
                            <FormBuilder toolCallId={toolCallId}/>
                        </BotCard>
                    )
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
            },
            showSupervisedTaskUI: {
                description: 'Show this UI if user want to perform anything related to "retargeting campaign" or "AB testing between adsets"',
                parameters: z.object({
                    task_name:z.string().describe("Name of the task which user asked to perform")
                }),
                generate: async function* ({task_name}) {
                    console.log('tool call showSupervisedTaskUI')
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    const allMessages = aiState.get().messages;

                    // Filter user messages only (assuming 'role' field exists)
                    const userMessages = allMessages.filter(msg => msg.role === 'user');

                    // Get the last 6 user messages (if available)
                    const lastSixUserMessages = userMessages.slice(-6);

                    yield(
                        <BotCard>
                            {/* <PlacementTargeting toolCallId={toolCallId}/> */}
                            <p className='mb-2'>Please wait we are processing your query.</p>
                        </BotCard>
                    )
                    const messages = lastSixUserMessages.map(msg => (msg.content)) as string[];
                    await sendSupervisedTaskMail(
                        task_name,
                        messages,
                        session?.user.email,
                        getBaseUrl()+"/supervised/chat/"+chatId+"/task/"+toolCallId+"?user_email="+session?.user.email  // TODO: Need to find better way to change this URL at one place if we change route of this task.
                    )

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
                                        toolName: 'showSupervisedTaskUI',
                                        toolCallId,
                                        args: {task_name}
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
                                        toolName: 'showSupervisedTaskUI',
                                        toolCallId,
                                        result: {
                                            content:"",
                                            status:"pending"
                                        }
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    return (
                        <BotCard>
                            <SupervisedTaskMessage/>
                        </BotCard>
                    )
                }
            },
            showAdsetConnectionUI: {
                description: 'Show a UI to connect a adset to the chat.',
                parameters: z.object({}),
                generate: async function* ({}) {
                    console.log('tool call showAdsetConnectionUI')
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
                                        toolName: 'showAdsetConnectionUI',
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
                                        toolName: 'showAdsetConnectionUI',
                                        toolCallId,
                                        result: { toolCallId }
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    return (
                        <BotCard>
                            <ConnectAdset toolCallId={toolCallId} />
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
        confirmCreateLeadgenForm,
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
                            case 'showAdsetConnectionUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ConnectAdset {...tool.result} toolCallId={tool.toolCallId} />
                                    </BotCard>
                                )
                            case 'showPlacementTargetingUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <PlacementTargeting {...tool.result} toolCallId={tool.toolCallId} />
                                    </BotCard>
                                )
                            case 'showFormBuilder':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <FormBuilder {...tool.result} toolCallId={tool.toolCallId} isReadOnly />
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
