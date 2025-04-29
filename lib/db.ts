import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'fasty_user',
  password: process.env.POSTGRES_PASSWORD || 'fasty_password',
  database: process.env.POSTGRES_DATABASE || 'ai_marketing_manager',
});

// Initialize Drizzle with the connection pool and schema
export const db = drizzle(pool, { schema });

// Export the pool for direct access if needed
export { pool }; 