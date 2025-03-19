'use client'

import { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
// Import directly from the set-budget file instead of the directory to avoid circular imports
import { Purchase } from '@/components/stocks/set-budget'

interface BudgetSetterProps {
  symbol: string;
  price: number;
  numberOfShares?: number;
  guideForUser?: string;
}

export function BudgetSetterActiveUIWrapper({ 
  symbol, 
  price, 
  numberOfShares, 
  guideForUser 
}: BudgetSetterProps) {
  const { setActiveUI } = useActiveUI()
  
  useEffect(() => {
    const initialBudget = numberOfShares || price;
    
    if (initialBudget <= 0 || initialBudget > 1000) {
      return; // Invalid budget, don't show in sidebar
    }
    
    const content = (
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
    )
    
    // Register it with the active UI context
    setActiveUI(content, 'budgetSetter', 'Campaign Budget Settings')
  }, [symbol, price, numberOfShares, guideForUser, setActiveUI])
  
  // Return null here since the content will be displayed in the sidebar
  return null
}