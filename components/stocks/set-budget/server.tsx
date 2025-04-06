"use server";

import { BotCard } from "@/components/stocks/message"
import { BudgetSetterActiveUIWrapper } from "./active-ui-wrapper"
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";

// Make sure we don't have a circular dependency by directly importing Purchase
import { Purchase } from '@/components/stocks/set-budget'

interface BudgetSetterServerProps {
  symbol: string;
  price: number;
  numberOfShares?: number;
  guideForUser?: string;
}

/**
 * Server component that renders the Budget Setter
 * to be displayed in the side panel when called by the AI
 */
export default async function showBudgetSetter({ 
  symbol, 
  price, 
  numberOfShares, 
  guideForUser 
}: BudgetSetterServerProps) {
  const initialBudget = numberOfShares || price;
  
  if (initialBudget <= 0 || initialBudget > 1000) {
    return (
      <BotCard>
        <p>Invalid budget amount. Please specify a budget between €10 and €1000.</p>
      </BotCard>
    );
  }
  
  // Create the purchase component that will be displayed in the sidebar
  const purchaseComponent = (
    <div className="flex flex-col h-full">
      <Purchase 
        props={{
          symbol,
          price: +price,
          initialBudget,
          status: 'Confirm your Ad Budget'
        }}
      />
      {guideForUser && <div className="mt-4">{guideForUser}</div>}
    </div>
  );
  
  return (
    <>
      {/* This registers the component with the active UI context */}
      <BudgetSetterActiveUIWrapper 
        symbol={symbol}
        price={price}
        numberOfShares={numberOfShares}
        guideForUser={guideForUser}
      />
      
      {/* This explicitly opens the sidebar */}
      <SidebarContentWrapper 
        content={purchaseComponent}
        title="Campaign Budget Settings"
        onMount={true}
      />
      
      <BotCard>
        <p>
          The budget settings for campaign &quot;{symbol}&quot; are now available in the sidebar. 
          You can adjust the daily budget and see the total monthly investment.
        </p>
      </BotCard>
    </>
  );
}