import logger from '@/lib/logger';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ CRITICAL ERROR: DATABASE_URL is not set');
  logger.error('Available environment variables:');
  logger.error(Object.keys(process.env).sort());
  throw new Error(
    'DATABASE_URL is not set - Check your environment variables configuration',
  );
}

logger.log('✅ DATABASE_URL found, attempting connection...');

// Create a postgres connection with error handling
let client: postgres.Sql;
try {
  client = postgres(connectionString, {
    onnotice: (notice) => logger.log('DB Notice:', notice),
  });
  logger.log('✅ Database client created successfully');
} catch (error) {
  logger.error('❌ Failed to create database client:', error);
  throw error;
}

// Create the drizzle instance with error handling
let db: ReturnType<typeof drizzle>;
try {
  db = drizzle(client, { schema });
  logger.log('✅ Drizzle ORM initialized successfully');
} catch (error) {
  logger.error('❌ Failed to initialize Drizzle ORM:', error);
  throw error;
}

export { db };

// Export schema for convenience
export * from './schema';
