import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Add comprehensive environment logging
console.log('🔍 Database Connection Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
console.log(
  'Available env vars:',
  Object.keys(process.env).filter(
    (key) => key.includes('DATABASE') || key.includes('SUPABASE'),
  ),
);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL is not set');
  console.error('Available environment variables:');
  console.error(Object.keys(process.env).sort());
  throw new Error(
    'DATABASE_URL is not set - Check your environment variables configuration',
  );
}

console.log('✅ DATABASE_URL found, attempting connection...');

// Create a postgres connection with error handling
let client: postgres.Sql;
try {
  client = postgres(connectionString, {
    onnotice: (notice) => console.log('DB Notice:', notice),
  });
  console.log('✅ Database client created successfully');
} catch (error) {
  console.error('❌ Failed to create database client:', error);
  throw error;
}

// Create the drizzle instance with error handling
let db: ReturnType<typeof drizzle>;
try {
  db = drizzle(client, { schema });
  console.log('✅ Drizzle ORM initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Drizzle ORM:', error);
  throw error;
}

export { db };

// Export schema for convenience
export * from './schema';
