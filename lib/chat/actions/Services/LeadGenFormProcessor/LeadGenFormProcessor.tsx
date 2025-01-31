import {LeadgenFrom} from "@/lib/types";
import {nanoid, runAsyncFnWithoutBlocking, sleep} from "@/lib/utils";
import {createLeadgenForm} from "@/lib/api/fasty-bot/create-leadgen-form";
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {fetchChatFbAdsetId, updateLeadFormInAdset} from "@/app/actions";
import {SystemErrorMessage, SystemMessage} from "@/components/stocks";
import {AI} from "@/lib/chat/actions";
import {createStreamableUI, createStreamableValue, getMutableAIState} from "ai/rsc";


export async function confirmCreateLeadgenForm(toolCallId: string, data: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    const systemMessage = createStreamableUI(null);
    const responseStream = createStreamableValue<LeadgenFrom | boolean>(false);

    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        const response = await createLeadgenForm(data);
        let chatSlug = getChatIdFromUrl();
        if(chatSlug){
            let fbAdsetIdResponse = await fetchChatFbAdsetId(chatSlug);
            if(fbAdsetIdResponse.success){
                const adSetId = fbAdsetIdResponse.fbAdsetId as string;
                updateLeadFormInAdset(adSetId, response.id)
            }
        }
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
                    You have successfully created a lead generation form
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