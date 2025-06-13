import { NextResponse } from 'next/server';

export async function GET() {
  // Check various sources of the API key
  const sources = {
    processEnv: process.env.OPENAI_API_KEY?.substring(0, 20) + '...',
    processEnvLength: process.env.OPENAI_API_KEY?.length,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter((key) =>
      key.includes('OPENAI'),
    ),
  };

  return NextResponse.json(sources);
}
