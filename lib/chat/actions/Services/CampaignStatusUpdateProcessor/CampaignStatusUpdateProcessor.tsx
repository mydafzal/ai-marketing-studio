import {createStreamableUI, getMutableAIState} from 'ai/rsc'
import {spinner, SystemMessage} from '@/components/stocks'

import {nanoid, runAsyncFnWithoutBlocking, sleep} from '@/lib/utils'
import {setCampaignStatus} from '@/lib/api/fasty-bot/set-campaign-status';
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {AI} from "@/lib/chat/actions";

// #Usage: Search for `confirmCampaignStatusChange`
export async function confirmCampaignStatusChange(campaignName: string, status: string) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place
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