import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 [Debug API] Environment check requested');

  const envInfo = {
    timestamp: new Date().toISOString(),
    NODE_ENV: process.env.NODE_ENV,

    // Database
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    DATABASE_URL_PREFIX:
      process.env.DATABASE_URL?.substring(0, 30) || 'NOT_SET',

    // Supabase
    SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    SUPABASE_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    SUPABASE_KEY_PREFIX:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) || 'NOT_SET',

    // Environment analysis
    RELEVANT_ENV_KEYS: Object.keys(process.env).filter(
      (key) =>
        key.includes('DATABASE') ||
        key.includes('SUPABASE') ||
        key.includes('POSTGRES'),
    ),
    TOTAL_ENV_VARS: Object.keys(process.env).length,

    // AWS/Amplify specific
    AMPLIFY_ENV_VARS: Object.keys(process.env).filter(
      (key) => key.includes('AMPLIFY') || key.includes('AWS'),
    ),
    AWS_REGION: process.env.AWS_REGION,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,

    // Build info
    NEXT_DEPLOYMENT_ID: process.env.NEXT_DEPLOYMENT_ID,
    NODE_ENV_ACTUAL: process.env.NODE_ENV,

    // Runtime info
    RUNTIME_TYPE: process.env.__NEXT_PRIVATE_RUNTIME_TYPE,
    LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,

    // All environment variables (for debugging)
    ALL_ENV_KEYS: Object.keys(process.env).sort(),
  };

  console.log('🔍 [Debug API] Environment info:', envInfo);

  return NextResponse.json(envInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
