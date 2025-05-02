import React, { useState, useEffect } from 'react';

interface BudgetSettingsProps {
  budget: string;
  setBudget: React.Dispatch<React.SetStateAction<string>>;
}

interface CurrencyBudgetData {
  name: string;
  code: string;
  min_daily_budget_without_offset_closest_int: number;
  error: string | null;
}

export function BudgetSettings({ budget, setBudget }: BudgetSettingsProps) {
  const [currencyData, setCurrencyData] = useState<CurrencyBudgetData | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fallback values
  const DEFAULT_CURRENCY = 'USD';
  const DEFAULT_MIN_BUDGET = 5;

  useEffect(() => {
    const fetchCurrencyData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/fasty-bot/proxy-get-currency-and-min-budget');
        
        if (!response.ok) {
          throw new Error('Failed to fetch currency data');
        }
        
        const data = await response.json();
        setCurrencyData(data);
        setFetchError(false);
      } catch (err) {
        console.error('Error fetching currency data:', err);
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencyData();
  }, []);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBudget(value);
  };

  const validateBudget = () => {
    if (!budget) return;
    
    const budgetValue = parseFloat(budget);
    
    // If we have currency data, use it; otherwise use fallback values
    const minBudget = currencyData?.min_daily_budget_without_offset_closest_int || DEFAULT_MIN_BUDGET;
    const currencyCode = currencyData?.code || DEFAULT_CURRENCY;
    
    if (isNaN(budgetValue)) {
      setValidationError('Please enter a valid number');
    } else if (budgetValue < minBudget) {
      setValidationError(`The minimum budget allowed is ${minBudget} ${currencyCode}`);
    } else {
      setValidationError(null);
    }
  };

  useEffect(() => {
    validateBudget();
  }, [budget, currencyData]);

  // Display the minimum budget or the fallback info
  const renderBudgetInfo = () => {
    if (isLoading) {
      return null;
    }
    
    if (fetchError) {
      return (
        <div className="text-xs text-text-light-gray mb-1">
          Could not fetch currency info. Using default minimum budget: {DEFAULT_MIN_BUDGET} {DEFAULT_CURRENCY}
        </div>
      );
    }
    
    if (currencyData) {
      return (
        <div className="text-xs text-text-light-gray mb-1">
          Minimum budget: {currencyData.min_daily_budget_without_offset_closest_int} {currencyData.code}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div>
      {renderBudgetInfo()}
      <div className="relative">
        <input
          type="text"
          value={budget}
          onChange={handleBudgetChange}
          placeholder={isLoading ? "Loading..." : "Enter daily budget"}
          className={`w-full px-3 py-2.5 bg-dark-bg border ${validationError ? 'border-red-500' : 'border-border-dark'} text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200 pr-16`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-light-gray pointer-events-none">
          <span>{isLoading ? 'Checking Currency...' : (currencyData?.code || DEFAULT_CURRENCY)}</span>
        </div>
      </div>
      {validationError && <div className="text-red-500 text-xs mt-1">{validationError}</div>}
    </div>
  );
}