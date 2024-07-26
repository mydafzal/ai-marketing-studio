'use client';

import { useState } from 'react';
import { useActions, useAIState, useUIState } from 'ai/rsc';
import { formatNumber } from '@/lib/utils';

import type { AI } from '@/lib/chat/actions';

interface Purchase {
  symbol: string;
  price: number;
  initialBudget?: number;
  status: 'requires_action' | 'completed' | 'expired';
}

export function Purchase({
  props: { symbol, price, initialBudget = 10, status = 'expired' }
}: {
  props: Purchase
}) {
  const days = 30; // Fixed days for the budget period
  const [budget, setBudget] = useState(initialBudget);
  const [purchasingUI, setPurchasingUI] = useState<null | React.ReactNode>(null);
  const [aiState, setAIState] = useAIState<typeof AI>();
  const [, setMessages] = useUIState<typeof AI>();
  const { confirmPurchase } = useActions();

  function onBudgetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newBudget = Number(e.target.value);
    setBudget(newBudget);
    setAIState({
      ...aiState,
      messages: [...aiState.messages, { id: 'budget-change', role: 'system', content: `Budget updated to ${newBudget}. Total cost for 30 days: ${formatNumber(newBudget * days)}.` }]
    });
  }

  return (
    <div className="p-4 text-green-400 border rounded-xl bg-zinc-950">
      <div className="text-lg text-zinc-300">{symbol}</div>
      <div className="text-3xl font-bold">{formatNumber(budget)}</div>
      {purchasingUI ? (
        <div className="mt-4 text-zinc-200">{purchasingUI}</div>
      ) : (
        <>
          <div className="relative pb-6 mt-6">
            <p>Ad Budget per Day</p>
            <input
              type="range"
              min="10"
              max="1000"
              value={budget}
              onChange={onBudgetChange}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-zinc-600 accent-green-500"
            />
            <div className="absolute w-full flex justify-between text-xs px-2">
              <span>€10</span>
              <span>€500</span>
              <span>€1000</span>
            </div>
          </div>
          <div className="mt-6">
            <p>Total cost</p>
            <div className="text-xl font-bold">
              {days} Days × {formatNumber(budget)} per day = {formatNumber(days * budget)}
            </div>
          </div>
          <button
            className="w-full px-4 py-2 mt-6 font-bold text-zinc-900 bg-green-400 rounded-lg hover:bg-green-500"
            onClick={async () => {
              const response = await confirmPurchase(symbol, budget, days);
              setPurchasingUI(response.purchasingUI);
              setMessages((currentMessages) => [...currentMessages, response.newMessage]);
            }}
          >
            Set Ad Budget
          </button>
        </>
      )}
    </div>
  );
}