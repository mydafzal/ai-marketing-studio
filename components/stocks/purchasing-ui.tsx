import { formatNumber } from '@/lib/utils';

export interface IPurchasingUiProp {
    success: boolean;
    budget: number;
    campaignName: string;
    days: number;
    totalBudget: number;
}

export const PurchasingUi = ({
    success,
    budget,
    campaignName,
    days,
    totalBudget
}: IPurchasingUiProp) => {
    return success ? (
        <div>
            <p className="mb-2">
                You have successfully set your ad budget for {campaignName}. Daily budget:
                {formatNumber(budget)}, Total for {days} days: {formatNumber(totalBudget)}.
            </p>
        </div>
    ) : (
        <div>
            <p className="mb-2 text-red-500">
                Error: Failed to set the ad budget for {campaignName}. Please try again later.
            </p>
        </div>
    )
}