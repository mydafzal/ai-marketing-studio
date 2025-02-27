'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';

// Define the shape of our active UI state
type ActiveUIContextType = {
  setActiveUI: (component: React.ReactNode, type: string, title?: string) => void;
  activeUI: { 
    component: React.ReactNode; 
    type: string;
    title?: string;
  } | null;
  clearActiveUI: () => void;
};

// Create the context
const ActiveUIContext = createContext<ActiveUIContextType | undefined>(undefined);

// Create a provider component
export function ActiveUIProvider({ children }: { children: React.ReactNode }) {
  const [activeUI, setActiveUIState] = useState<{ 
    component: React.ReactNode; 
    type: string;
    title?: string;
  } | null>(null);
  
  const setActiveUI = useCallback((component: React.ReactNode, type: string, title?: string) => {
    setActiveUIState({ component, type, title });
  }, []);
  
  const clearActiveUI = useCallback(() => {
    setActiveUIState(null);
  }, []);

  return (
    <ActiveUIContext.Provider value={{ setActiveUI, activeUI, clearActiveUI }}>
      {children}
    </ActiveUIContext.Provider>
  );
}

// Create a hook to use the context
export const useActiveUI = () => {
  const context = useContext(ActiveUIContext);
  if (!context) {
    throw new Error('useActiveUI must be used within an ActiveUIProvider');
  }
  return context;
};