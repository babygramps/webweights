import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 [Debug API] Environment check requested');

  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    DATABASE_URL_PREFIX:
      process.env.DATABASE_URL?.substring(0, 20) || 'NOT_SET',
    SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    SUPABASE_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    ALL_ENV_KEYS: Object.keys(process.env).filter(
      (key) =>
        key.includes('DATABASE') ||
        key.includes('SUPABASE') ||
        key.includes('POSTGRES'),
    ),
    TOTAL_ENV_VARS: Object.keys(process.env).length,
    AMPLIFY_ENV_VARS: Object.keys(process.env).filter(
      (key) => key.includes('AMPLIFY') || key.includes('AWS'),
    ),
  };

  console.log('🔍 [Debug API] Environment info:', envInfo);

  return NextResponse.json(envInfo);
}
