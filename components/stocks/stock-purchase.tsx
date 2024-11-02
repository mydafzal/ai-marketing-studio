'use client';

import { useState } from 'react';
import { useActions, useAIState, useUIState } from 'ai/rsc';
import { PurchasingUi, type IPurchasingUiProp } from '@/components/stocks/purchasing-ui';
import { formatNumber } from '@/lib/utils';
import { DollarSign, Calendar, ArrowRight, Coins } from 'lucide-react';

import type { AI } from '@/lib/chat/actions';

interface Purchase {
  symbol: string;
  price: number;
  initialBudget?: number;
  status: 'requires_action' | 'completed' | 'expired';
  purchasingUiProps?: IPurchasingUiProp;
}

export function Purchase({
  props: { symbol, price, initialBudget = 10, status = 'expired', purchasingUiProps }
}: {
  props: Purchase
}) {
  const days = 30; // Fixed days for the budget period
  const [budget, setBudget] = useState(initialBudget);
  const [purchasingUI, setPurchasingUI] = useState<null | React.ReactNode>(
    purchasingUiProps ? (
      <PurchasingUi {...purchasingUiProps} />
    ) : null
  );
  const [aiState, setAIState] = useAIState<typeof AI>();
  const [, setMessages] = useUIState<typeof AI>();
  const { confirmPurchase } = useActions();

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

  return (
    <div className="p-6 text-white border rounded-xl bg-zinc-950 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-zinc-200">{symbol}</h3>
          <p className="text-sm text-zinc-400">Campaign Budget Configuration</p>
        </div>
        <div className="px-3 py-1 text-sm rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
          {status}
        </div>
      </div>

      {purchasingUI ? (
        <div className="mt-4">{purchasingUI}</div>
      ) : (
        <>
          {/* Daily Budget Section */}
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="size-5 text-green-400" />
                <h4 className="font-medium text-zinc-200">Daily Budget</h4>
              </div>
              <div className="text-3xl font-bold text-green-400 mb-4">
                {formatNumber(budget)}
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={budget}
                  onChange={onBudgetChange}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-700 accent-green-500"
                />
                <div className="absolute w-full flex justify-between text-xs text-zinc-400 mt-2">
                  <span>€10</span>
                  <span>€500</span>
                  <span>€1000</span>
                </div>
              </div>
            </div>

            {/* Duration Section */}
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="size-5 text-blue-400" />
                <h4 className="font-medium text-zinc-200">Ad Budget calculation based on one Month</h4>
              </div>
              <div className="text-2xl font-semibold text-blue-400">
                {days} Days
              </div>
            </div>

            {/* Total Cost Section */}
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="size-5 text-purple-400" />
                <h4 className="font-medium text-zinc-200">Total Investment</h4>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <span>{days} Days</span>
                <ArrowRight className="size-4" />
                <span>{formatNumber(budget)} daily</span>
                <ArrowRight className="size-4" />
                <span className="text-2xl font-bold text-purple-400">{formatNumber(days * budget)}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              className="w-full px-6 py-3 font-semibold text-zinc-900 bg-green-400 rounded-lg hover:bg-green-500 transition-colors duration-200 flex items-center justify-center gap-2"
              onClick={async () => {
                const response = await confirmPurchase(symbol, budget, days);
                setPurchasingUI(response.purchasingUI);
                setMessages((currentMessages) => [...currentMessages, response.newMessage]);
              }}
            >
              <DollarSign className="size-5" />
              Set Campaign Budget
            </button>
          </div>
        </>
      )}
    </div>
  );
}