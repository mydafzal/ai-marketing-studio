'use client'

import { useEffect } from 'react'
import { BotCard } from "@/components/stocks/message";
import { Purchase } from '@/components/stocks/set-budget'
import { useActiveUI } from '@/components/stocks/active-ui-context'

interface BudgetSetterProps {
  symbol: string;
  price: number;
  numberOfShares?: number;
  guideForUser?: string;
}

// The main component that shows both the sidebar (via Active UI) and a message in the chat
export default function BudgetSetter({ 
  symbol, 
  price, 
  numberOfShares, 
  guideForUser 
}: BudgetSetterProps) {
  const { setActiveUI } = useActiveUI();
  const initialBudget = numberOfShares || price;
  
  useEffect(() => {
    // Create the content to show in the sidebar
    const sidebarContent = (
      <div className="flex flex-col h-full">
        <Purchase 
          props={{
            symbol,
            price: +price,
            initialBudget,
            status: 'requires_action'
          }}
        />
        {guideForUser && <div className="mt-4">{guideForUser}</div>}
      </div>
    );
    
    // Set the active UI to display in the sidebar
    setActiveUI(sidebarContent, 'budgetSetter', 'Campaign Budget Settings');
    
    // Cleanup function
    return () => {
      // Optional cleanup if needed
    };
  }, [symbol, price, initialBudget, guideForUser, setActiveUI]);
  
  // Return the message to show in the chat
  return (
    <BotCard>
      <p>
        The budget settings for campaign &quot;{symbol}&quot; are now available in the sidebar. 
        You can adjust the daily budget and see the total monthly investment.
      </p>
    </BotCard>
  );
}