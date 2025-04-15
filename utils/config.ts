let configCache: any = null;

export async function getConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    const response = await fetch('/api/config');
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