import { NextResponse } from 'next/server';

export async function GET() {
  // Only return the necessary public config values
  const config = {
    crispWebsiteId: process.env.CRISP_WEBSITE_ID,
    posthogApiKey: process.env.POSTHOG_API_KEY,
    encryptionKey: process.env.ENCRYPTION_KEY,
  };

  return NextResponse.json(config);
} 