import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {fetchChatCampaignBudget} from "@/app/actions";
import {nanoid, runAsyncFnWithoutBlocking, sleep} from "@/lib/utils";
import {createCampaignAd} from "@/lib/api/fasty-bot/create-ad";
import {SystemMessage} from "@/components/stocks";
import {AI} from "@/lib/chat/actions";
import {createStreamableUI, createStreamableValue, getMutableAIState} from "ai/rsc";

export async function confirmCreateAd(campaign: any, data: any, adset: any) {
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
        const budget = await fetchChatCampaignBudget(chatId) //TODO: remove hardcoded fallback budget setting as it will fail
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