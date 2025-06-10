import logger from '@/lib/logger';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';

// ---------------------------------------------------------------------------
// Create / reuse a single postgres.js pool per Node.js process.
// This prevents "Max client connections reached" errors by ensuring we only
// open a handful of connections that pgBouncer (port 6543) can multiplex.
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.error('❌ CRITICAL ERROR: DATABASE_URL is not set');
  throw new Error('DATABASE_URL is not set');
}

// Use a typed global to store the pool between hot-reloads (Next.js / Vite)
// and between lambda cold starts (if supported by the environment).

const globalForDb = globalThis as unknown as {
  sql?: Sql;
  db?: ReturnType<typeof drizzle>;
};

if (!globalForDb.sql) {
  logger.log('🌱 Creating new postgres.js pool');

  globalForDb.sql = postgres(DATABASE_URL, {
    max: 5, // <= Supabase free tier limit; adjust as you need
    idle_timeout: 60, // seconds before idle connection is closed
    connect_timeout: 30, // seconds to wait for initial connection
    onnotice: (notice) => logger.log('DB Notice:', notice),
  });

  globalForDb.db = drizzle(globalForDb.sql, { schema });

  logger.log('✅ Postgres pool & Drizzle ORM initialised');
} else {
  logger.log('♻️  Reusing existing Postgres pool');
}

export const db = globalForDb.db!;

// Re-export schema for convenience
export * from './schema';
