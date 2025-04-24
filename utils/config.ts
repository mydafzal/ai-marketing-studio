import {getBaseUrl} from "@/lib/helpers/vercel/get-base-url"

let configCache: any = null;

export async function getConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    let baseUrl = getBaseUrl();
    if (baseUrl.includes('undefined')) {
      baseUrl = "http://localhost:3000"
    }
    const response = await fetch(`${baseUrl}/api/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    configCache = await response.json();
    return configCache;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
} 