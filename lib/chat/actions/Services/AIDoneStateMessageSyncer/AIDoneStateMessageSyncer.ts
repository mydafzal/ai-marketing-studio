import {AI} from "@/lib/chat/actions";
import {getMutableAIState} from "ai/rsc";

export async function syncMessages() {
    'use server'

    const aiState = getMutableAIState<typeof AI>();
    console.log('syncMessages', aiState.get().messages[0])
    aiState.done({
        ...aiState.get(),
    });
}