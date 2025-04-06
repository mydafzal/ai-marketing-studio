import { z } from 'zod';
import { BotCard, BotMessage, Purchase } from '@/components/stocks';
import {ModuleConfigBuilder} from "@/lib/ui-magic/moduleConfigBuilder";

export interface AdBudgetParams {
    symbol: string;
    price: number;
    numberOfShares?: number;
    guideForUser?: string;
}

export const adBudgetModule = new ModuleConfigBuilder('showAdBudgetUI')
    .setDescription('Show Facebook Ad Campaign name and the UI to set ad budget')
    .setParameters(z.object({
        symbol: z.string().describe('The name of the digital marketing campaign'),
        price: z.number().describe('Current daily amount of ad budget spent'),
        numberOfShares: z.number().optional().describe('Daily ad spend for campaign'),
        guideForUser: z.string().optional().describe('Guide for user about this component')
    }))
    .setComponent(async ({ symbol, price, numberOfShares, guideForUser }: AdBudgetParams) => {
        const initialBudget = numberOfShares || price;

        if (initialBudget <= 0 || initialBudget > 1000) {
            return <BotMessage content={'Invalid amount'}/>;
        }

        return (
            <>
                <BotCard>
                    <Purchase
                        props={{
                            symbol,
                            price: +price,
                            initialBudget,
                            status: 'Confirm your Ad Budget'
                        }}
                    />
                </BotCard>
                <div className="my-4">
                    {guideForUser ?? ''}
                </div>
            </>
        );
    })
    .build();

export default adBudgetModule;