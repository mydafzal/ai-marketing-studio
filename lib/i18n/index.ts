// Supported languages - matches the onboarding language options
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  nl: 'Dutch', 
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  fr: 'French',
  pt: 'Portuguese',
  ro: 'Romanian'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Translation type - will be the structure of our JSON files
export interface Translations {
  // Navigation & Header
  navigation: {
    aiMarketer: string;
    aiCreatives: string;
    login: string;
    signOut: string;
  };
  
  // Sidebar & Chat
  sidebar: {
    shareChat: string;
    deleteChat: string;
    newChat: string;
    clearHistory: string;
    sharedChat: string;
  };
  
  // Common actions
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    share: string;
    create: string;
    update: string;
    confirm: string;
    back: string;
    next: string;
    skip: string;
    continue: string;
    finish: string;
    tryThis: string;
  };
  
  // Onboarding - keeping existing structure
  onboarding: {
    steps: {
      personal: string;
      company: string;
      website: string;
      preferences: string;
      locations: string;
      confirm: string;
    };
    fields: {
      firstName: string;
      lastName: string;
      companyName: string;
      companyDescription: string;
      websiteLink: string;
      privacyPolicyLink: string;
      preferredLanguage: string;
      preferredLanguageDescription: string;
      companySegment: string;
      companySegmentDescription: string;
      preferredLocations: string;
      preferredLocationsDescription: string;
    };
    segments: {
      freelancer: string;
      startup: string;
      smallBusiness: string;
      midSized: string;
      enterprise: string;
      nonprofit: string;
      education: string;
      government: string;
      other: string;
    };
    goals: {
      generateLeads: string;
      recruitEmployees: string;
      increaseConversions: string;
    };
    placeholders: {
      firstName: string;
      lastName: string;
      companyName: string;
      companyDescription: string;
      websiteLink: string;
      privacyPolicyLink: string;
    };
    descriptions: {
      companyGoals: string;
      profileName: string;
      profileNameNote: string;
    };
  };
  
  // Dialogs & Modals
  dialogs: {
    deleteConfirmation: {
      title: string;
      description: string;
      confirmDelete: string;
    };
    clearHistory: {
      title: string;
      description: string;
    };
    shareChat: {
      title: string;
      description: string;
      copyError: string;
      copySuccess: string;
    };
  };
  
  // Messages & Notifications
  messages: {
    chatDeleted: string;
    error: string;
    success: string;
    loading: string;
  };
  
  // Profile sections
  profile: {
    personalInformation: string;
    companyInformation: string;
    websiteDetails: string;
    preferences: string;
  };
  
  // Forms & Validation
  forms: {
    required: string;
    selectLanguage: string;
    selectSegment: string;
    searchLocations: string;
    searchPlaceholder: string;
    validation: {
      companyNameRequired: string;
      companyDescriptionRequired: string;
      languageRequired: string;
      invalidUrl: string;
      noCommasAllowed: string;
    };
  };

  // Empty Screen
  emptyScreen: {
    title: string;
    actions: {
      createCampaign: {
        title: string;
        description: string;
      };
      viewResults: {
        title: string;
        description: string;
      };
      analyzeResults: {
        title: string;
        description: string;
      };
      downloadLeads: {
        title: string;
        description: string;
      };
      changeBudget: {
        title: string;
        description: string;
      };
      toggleCampaigns: {
        title: string;
        description: string;
      };
      leadNotifications: {
        title: string;
        description: string;
      };
    };
  };

  // Prompt messages
  prompts: {
    createCampaign: string;
    viewResults: string;
    analyzePerformance: string;
    downloadLeads: string;
    changeBudget: string;
    toggleCampaign: string;
    manageNotifications: string;
  };
}

// Load translations dynamically
const loadTranslations = async (language: SupportedLanguage): Promise<Translations> => {
  try {
    const translations = await import(`./translations/${language}.json`);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}, falling back to English`);
    const fallback = await import(`./translations/en.json`);
    return fallback.default;
  }
};

// Translation cache
const translationCache = new Map<SupportedLanguage, Translations>();

export const getTranslations = async (language: SupportedLanguage): Promise<Translations> => {
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }
  
  const translations = await loadTranslations(language);
  translationCache.set(language, translations);
  return translations;
};

// Utility function to get nested translation value
export const getNestedTranslation = (translations: Translations, key: string): string => {
  const keys = key.split('.');
  let current: any = translations;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return key; // Return the key if translation not found
    }
  }
  
  return typeof current === 'string' ? current : key;
}; 