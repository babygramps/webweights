import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Create a postgres connection
const client = postgres(connectionString);

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './schema';
