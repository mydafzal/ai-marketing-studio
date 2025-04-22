let configCache: any = null;

export async function getConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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