import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {fetchChatCampaignBudget} from "@/app/actions";
import {Adset} from "@/lib/types";
import {nanoid, runAsyncFnWithoutBlocking, sleep} from "@/lib/utils";
import {updateAdset} from "@/lib/api/fasty-bot/update-adset";
import {SystemErrorMessage, SystemMessage} from "@/components/stocks";
import {AI} from "@/lib/chat/actions";
import {createStreamableUI, createStreamableValue, getMutableAIState} from "ai/rsc";

export async function confirmUpdateAdset(toolCallId: string, adsetId: string, adset: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    const chatId = getChatIdFromUrl()?.toString() || ''

    const budget = await fetchChatCampaignBudget(chatId)
    let adsetUpdate = {...adset}
    if (budget.error) {
        adsetUpdate = {...adsetUpdate}
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
                    You have successfully updated your targeting
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
