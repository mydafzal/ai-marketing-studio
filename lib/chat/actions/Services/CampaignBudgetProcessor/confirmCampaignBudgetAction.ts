'use server';

import { BudgetSettingFlow } from './BudgetSettingFlow';

/**
 * A server action that creates and runs the budget setting flow.
 *
 * @param campaignName - Name of the campaign
 * @param budget - Daily budget to set
 * @param days - Optional number of days (default 30)
 * @returns Placeholders you can render in your UI (e.g., spinner and follow-up message).
 */

// #Usage: called in set-budget.tsx - await confirmCampaignBudgetAction(...
export async function confirmCampaignBudgetAction(
    campaignName: string,
    budget: number,
    days: number = 30
) {
    const flow = new BudgetSettingFlow(campaignName, budget, days);
    return flow.confirmBudget();
}
