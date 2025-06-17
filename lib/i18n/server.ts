import { auth } from '@/auth';
import { getUserDetail } from '@/app/actions';
import { 
  type SupportedLanguage, 
  type Translations, 
  DEFAULT_LANGUAGE, 
  getTranslations 
} from './index';

/**
 * Get the user's preferred language from the database
 * Falls back to DEFAULT_LANGUAGE if no user or preference found
 */
export async function getUserLanguage(): Promise<SupportedLanguage> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return DEFAULT_LANGUAGE;
    }

    const userDetail = await getUserDetail();
    if (!userDetail.success || !userDetail.user?.preferred_language) {
      return DEFAULT_LANGUAGE;
    }

    const lang = userDetail.user.preferred_language;
    
    // Validate that the stored language is supported
    const supportedLanguages = ['en', 'nl', 'de', 'es', 'it', 'fr', 'pt', 'ro'];
    if (supportedLanguages.includes(lang)) {
      return lang as SupportedLanguage;
    }

    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('Error getting user language:', error);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Get translations for server-side rendering
 * @param language Optional language override, otherwise uses user's preferred language
 */
export async function getServerTranslations(language?: SupportedLanguage): Promise<{
  language: SupportedLanguage;
  translations: Translations;
}> {
  const lang = language || await getUserLanguage();
  const translations = await getTranslations(lang);
  
  return {
    language: lang,
    translations
  };
}

/**
 * Server-side translation function
 * @param key Translation key (e.g., 'navigation.login')
 * @param language Optional language override
 */
export async function serverT(key: string, language?: SupportedLanguage): Promise<string> {
  try {
    const { translations } = await getServerTranslations(language);
    
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
  } catch (error) {
    console.error('Error in serverT:', error);
    return key;
  }
} 