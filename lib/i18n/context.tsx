'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type SupportedLanguage, 
  type Translations, 
  DEFAULT_LANGUAGE, 
  getTranslations,
  getNestedTranslation 
} from './index';

interface I18nContextType {
  language: SupportedLanguage;
  translations: Translations | null;
  t: (key: string) => string;
  changeLanguage: (lang: SupportedLanguage) => void;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
  userLanguage?: string | null; // From user preferences
}

export function I18nProvider({ 
  children, 
  initialLanguage, 
  userLanguage 
}: I18nProviderProps) {
  // Helper function to validate if a language is supported - defined first
  const isValidLanguage = (lang: string): boolean => {
    return ['en', 'nl', 'de', 'es', 'it', 'fr', 'pt', 'ro'].includes(lang);
  };

  // Determine the initial language based on user preference or fallback
  const getInitialLanguage = (): SupportedLanguage => {
    if (userLanguage && isValidLanguage(userLanguage)) {
      return userLanguage as SupportedLanguage;
    }
    if (initialLanguage) {
      return initialLanguage;
    }
    return DEFAULT_LANGUAGE;
  };

  const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage());
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    let isCancelled = false;

    const loadLanguageTranslations = async () => {
      setIsLoading(true);
      try {
        const newTranslations = await getTranslations(language);
        if (!isCancelled) {
          setTranslations(newTranslations);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        if (!isCancelled) {
          // Fallback to English if loading fails
          const fallbackTranslations = await getTranslations(DEFAULT_LANGUAGE);
          setTranslations(fallbackTranslations);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLanguageTranslations();

    return () => {
      isCancelled = true;
    };
  }, [language]);

  // Update language when userLanguage prop changes
  useEffect(() => {
    if (userLanguage && isValidLanguage(userLanguage)) {
      const newLang = userLanguage as SupportedLanguage;
      if (newLang !== language) {
        setLanguage(newLang);
      }
    }
  }, [userLanguage, language]);

  // Translation function
  const t = (key: string): string => {
    if (!translations) {
      return key; // Return key if translations not loaded
    }
    return getNestedTranslation(translations, key);
  };

  // Change language function
  const changeLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  const value: I18nContextType = {
    language,
    translations,
    t,
    changeLanguage,
    isLoading
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use translations
export function useTranslations() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within an I18nProvider');
  }
  return context;
}

// Utility hook for simple translation without context overhead
export function useT() {
  const { t } = useTranslations();
  return t;
} 