import {createStreamableUI, getMutableAIState} from 'ai/rsc';
import {formatNumber, nanoid} from '@/lib/utils';

import {SystemMessage} from '@/components/stocks';
import {PurchasingUi} from '@/components/stocks/purchasing-ui';

import {setDailyCampaignBudget} from '@/lib/api/fasty-bot/set-daily-campaign-budget';
import {updateChatCampaignBudget} from '@/app/actions';
import {getCampaignIdFromUrl} from '@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper';
import {getChatIdFromUrl} from '@/lib/api/fasty-bot/helpers/chat-id-from-url-helper';
import {AI} from '@/lib/chat/actions';

/**
 * Responsible for setting a daily budget for a given campaign.
 */
export class BudgetSettingFlow {
    private campaignName: string;
    private budget: number;
    private days: number;

    // Renamed to be more descriptive for a "budget" flow
    private budgetUI = createStreamableUI(null);
    private systemMessageUI = createStreamableUI(null);
    private newMessageUI = createStreamableUI(null);

    /**
     * @param campaignName - Name of the campaign
     * @param budget - Daily budget to set
     * @param days - How many days the campaign should run (default 30)
     */
    constructor(campaignName: string, budget: number, days: number = 30) {
        this.campaignName = campaignName;
        this.budget = budget;
        this.days = days;
    }

    /**
     * Main entry point: sets up UI placeholders, runs async logic in the background,
     * and returns placeholders that can be rendered immediately.
     */
    public async confirmBudget() {
        // Immediately return placeholders so UI can display while we process in background
        const placeholders = {
            // In the old code, you used "purchasingUI"
            purchasingUI: this.budgetUI.value,   // Just rename from budgetUI => purchasingUI
            newMessage: {
                id: nanoid(),
                display: this.newMessageUI.value,
            },
        };

        await this.handleBudgetProcess();

        return placeholders;
    }

    // --------------------------------------------------------------------------
    // PRIVATE METHODS
    // --------------------------------------------------------------------------

    /**
     * Encapsulates the entire flow of updating the budget and returning final UI.
     */
    private async handleBudgetProcess() {
        // Update budget on Facebook & DB
        const {success, totalBudget} = await this.updateBudgetOnFacebook();

        // Render final system message
        this.renderFinalSystemMessage(success, totalBudget);

        // Render final "budget" UI
        this.budgetUI.done(
            <PurchasingUi
                success={success}
                budget={this.budget}
                campaignName={this.campaignName}
                days={this.days}
                totalBudget={totalBudget}
            />
        );

        // Insert a short follow-up question
        const question = 'Would you like to continue?';
        this.newMessageUI.done(<div>{question}</div>);

        // Update the AI conversation
        this.updateConversation(question, success, totalBudget);
    }

    /**
     * Actually updates the budget in Facebook and DB, returning success status & total budget.
     */
    private async updateBudgetOnFacebook() {
        let campaignId = (await getCampaignIdFromUrl()) || '0';

        if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {
            campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0';
        }

        const chatId = (getChatIdFromUrl() || '').toString();

        // Attempt to set daily budget in FB
        const success = await setDailyCampaignBudget(campaignId, this.budget);

        // If success, also update local DB
        if (success) {
            await updateChatCampaignBudget(chatId, this.budget);
        }

        const totalBudget = this.budget * this.days;
        return {success, totalBudget};
    }

    /**
     * Final system message about success or failure.
     */
    private renderFinalSystemMessage(success: boolean, totalBudget: number) {
        if (success) {
            this.systemMessageUI.done(
                <SystemMessage>
                    Your ad campaign &apos;{this.campaignName}&apos; is now set to run for {this.days} days
                    with a daily budget of {formatNumber(this.budget)}.
                    Total budget: {formatNumber(totalBudget)}.
                    The budget has been updated on Facebook.
                </SystemMessage>
            );
        } else {
            this.systemMessageUI.done(
                <SystemMessage>
                    There was an error updating the budget for campaign &apos;{this.campaignName}&apos;
                    on Facebook. Please check your connection and try again.
                </SystemMessage>
            );
        }
    }

    /**
     * Updates the AI conversation state with a new assistant message.
     */
    private updateConversation(followUpQuestion: string, success: boolean, totalBudget: number) {
        const aiState = getMutableAIState<typeof AI>();

        aiState.done({
            ...aiState.get(),
            messages: [
                // Possibly modify the existing 'tool' message if needed
                ...aiState.get().messages.map((message) => {
                    if (message.role === 'tool') {
                        const [content] = message.content;
                        if (
                            content.type === 'tool-result' &&
                            content.toolName === 'showAdBudgetUI'
                        ) {
                            content.result = {
                                ...(content.result as object),
                                purchasingUiProps: {
                                    success,
                                    budget: this.budget,
                                    campaignName: this.campaignName,
                                    days: this.days,
                                    totalBudget,
                                },
                            };
                        }
                    }
                    return message;
                }),
                // Insert a follow-up question as a new 'assistant' message
                {
                    id: nanoid(),
                    role: 'assistant',
                    content: followUpQuestion,
                    timestamp: new Date().toISOString(),
                },
            ],
        });
    }
}
