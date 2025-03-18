import { BotCard } from "@/components/stocks/message"
import { BudgetSetterActiveUIWrapper } from "./active-ui-wrapper"

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
export default function showBudgetSetter({ 
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
  
  return (
    <>
      <BudgetSetterActiveUIWrapper 
        symbol={symbol}
        price={price}
        numberOfShares={numberOfShares}
        guideForUser={guideForUser}
      />
      <BotCard>
        <p>
          The budget settings for campaign "{symbol}" are now available in the sidebar. 
          You can adjust the daily budget and see the total monthly investment.
        </p>
      </BotCard>
    </>
  );
}