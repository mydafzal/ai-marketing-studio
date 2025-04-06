'use client';

import { useState } from 'react';
import { useActions, useAIState, useUIState } from 'ai/rsc';
import { PurchasingUi, type IPurchasingUiProp } from '@/components/stocks/purchasing-ui';
import { formatNumber } from '@/lib/utils';
import { DollarSign, Calendar, ArrowRight, Coins } from 'lucide-react';

import type { AI } from '@/lib/chat/AIManager';
import {spinner} from "./spinner";

interface Purchase {
  symbol: string;
  price: number;
  initialBudget?: number;
  status: 'requires_action' | 'completed' | 'expired' | string;
  purchasingUiProps?: IPurchasingUiProp;
}

export function Purchase({
                           props: { symbol, price, initialBudget = 10, status = 'expired', purchasingUiProps }
                         }: {
  props: Purchase
}) {
  const days = 30; // Fixed days for the budget period
  const [budget, setBudget] = useState(initialBudget);

  // If there's a "purchasingUiProps" available, initialize purchasingUI with it:
  const [purchasingUI, setPurchasingUI] = useState<null | React.ReactNode>(
      purchasingUiProps ? <PurchasingUi {...purchasingUiProps} /> : null
  );

  const [aiState, setAIState] = useAIState<typeof AI>();
  const [, setMessages] = useUIState<typeof AI>();

  // 1) Destructure our server action from useActions:
  const { confirmCampaignBudgetAction } = useActions();

  // 2) Add local "isLoading" for the spinner
  const [isLoading, setIsLoading] = useState(false);

  function onBudgetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newBudget = Number(e.target.value);
    setBudget(newBudget);

    setAIState({
      ...aiState,
      messages: [
        ...aiState.messages.filter(message => message.id !== 'budget-change'),
        {
          id: 'budget-change',
          role: 'system',
          content: `Budget updated to ${newBudget}. Total cost for 30 days: ${formatNumber(newBudget * days)}.`,
          timestamp: new Date().toISOString(),
        }
      ]
    });
  }

  async function handleSetBudget() {
    setIsLoading(true);
    try {
      // Call the server action
      const response = await confirmCampaignBudgetAction(symbol, budget, days);

      // Replace with placeholders from the server if needed
      setPurchasingUI(response.purchasingUI);
      setMessages(currentMessages => [...currentMessages, response.newMessage]);
    } finally {
      // Always stop showing the spinner
      setIsLoading(false);
    }
  }

  return (
      <div className="p-6 text-white border border-[#2A2E3A] rounded-xl bg-[#1A1D29] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">{symbol}</h3>
            <p className="text-sm text-[#ADB0B8]">Campaign Budget Configuration</p>
          </div>
          <div className="px-3 py-1 text-sm rounded-full bg-[#151925] text-[#4BF29C] border border-[#2A2E3A]">
            {status}
          </div>
        </div>

        {/* If we have purchasingUI set, display it. Otherwise, show the budget sliders & button */}
        {purchasingUI ? (
            <div className="mt-4">{purchasingUI}</div>
        ) : (
            <>
              <div className="space-y-6">
                {/* Daily Budget */}
                <div className="p-4 rounded-lg bg-[#0A0C14] border border-[#2A2E3A]">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="size-5 text-[#4BF29C]" />
                    <h4 className="font-medium text-white">Daily Budget</h4>
                  </div>
                  <div className="text-3xl font-bold text-[#4BF29C] mb-4">
                    {formatNumber(budget)}
                  </div>
                  <div className="relative">
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        value={budget}
                        onChange={onBudgetChange}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#151925] accent-[#4BF29C]"
                    />
                    <div className="absolute w-full flex justify-between text-xs text-[#8A8F99] mt-2">
                      <span>€10</span>
                      <span>€500</span>
                      <span>€1000</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-4 rounded-lg bg-[#0A0C14] border border-[#2A2E3A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="size-5 text-[#FF7D5A]" />
                    <h4 className="font-medium text-white">
                      Ad Budget calculation based on one Month
                    </h4>
                  </div>
                  <div className="text-2xl font-semibold text-[#FF7D5A]">
                    {days} Days
                  </div>
                </div>

                {/* Total Investment */}
                <div className="p-4 rounded-lg bg-[#0A0C14] border border-[#2A2E3A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="size-5 text-[#4BF29C]" />
                    <h4 className="font-medium text-white">Total Investment</h4>
                  </div>
                  <div className="flex items-center gap-3 text-[#ADB0B8]">
                    <span>{days} Days</span>
                    <ArrowRight className="size-4" />
                    <span>{formatNumber(budget)} daily</span>
                    <ArrowRight className="size-4" />
                    <span className="text-2xl font-bold text-[#4BF29C]">
                  {formatNumber(days * budget)}
                </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                    className="w-full px-6 py-3 font-semibold text-[#0A0C14] bg-[#4BF29C] rounded-lg hover:bg-[#3AD88C] transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={handleSetBudget}
                    disabled={isLoading} // disable button if loading
                >
                  <DollarSign className="size-5" />
                  {isLoading ? 'Processing...' : 'Set Campaign Budget'}
                </button>
              </div>
            </>
        )}

        {/* The client-side spinner UI (optional overlay or inline) */}
        {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-[#ADB0B8]">
              {spinner}
              <span>Updating budget...</span>
            </div>
        )}
      </div>
  );
}