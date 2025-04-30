import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import type { Config } from 'drizzle-kit';

// Prefer .env.local if it exists
const envPath = fs.existsSync(path.resolve(__dirname, '.env.local'))
  ? '.env.local'
  : '.env';

config({ path: path.resolve(__dirname, envPath) });

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.AI_MARKETING_MANAGER_DATABASE_URL || '',
  },
} satisfies Config;
