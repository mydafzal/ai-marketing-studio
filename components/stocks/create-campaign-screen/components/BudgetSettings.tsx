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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      } catch (err) {
        console.error('Error fetching currency data:', err);
        setError('Failed to load currency information');
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
    if (!budget || !currencyData) return;
    
    const budgetValue = parseFloat(budget);
    const minBudget = currencyData.min_daily_budget_without_offset_closest_int;
    
    if (isNaN(budgetValue) || budgetValue < minBudget) {
      setError(`The minimum budget allowed is ${minBudget} ${currencyData.code}`);
    } else {
      setError(null);
    }
  };

  useEffect(() => {
    validateBudget();
  }, [budget, currencyData]);

  return (
    <div>
      {currencyData && (
        <div className="text-xs text-text-light-gray mb-1">
          Minimum budget: {currencyData.min_daily_budget_without_offset_closest_int} {currencyData.code}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={budget}
          onChange={handleBudgetChange}
          placeholder={isLoading ? "Loading..." : "Enter daily budget"}
          className={`w-full px-3 py-2.5 bg-dark-bg border ${error ? 'border-red-500' : 'border-border-dark'} text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200 pr-16`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-light-gray pointer-events-none">
          <span>{isLoading ? 'Checking Currency...' : (currencyData?.code || 'USD')}</span>
        </div>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}