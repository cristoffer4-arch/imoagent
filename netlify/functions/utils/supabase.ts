import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Create a Supabase client with user JWT for Row Level Security (RLS)
 * Use this for user-specific operations
 */
export function createSupabaseClient(authHeader: string): SupabaseClient {
  // Extract JWT token from Authorization header
  const token = authHeader?.replace('Bearer ', '').trim();
  
  if (!token) {
    throw new Error('Missing authorization token');
  }

  // Create client with user's JWT for RLS
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Create a Supabase admin client with service role key
 * Use this for scheduled functions and admin operations that bypass RLS
 */
export function createServiceClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extract tenant_id from JWT token
 */
export function getTenantIdFromToken(authHeader: string): string {
  try {
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) {
      throw new Error('Missing authorization token');
    }

    // Decode JWT (simple base64 decode of payload)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    return payload.sub || payload.user_id;
  } catch (error) {
    throw new Error('Invalid authorization token');
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  if (!SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}
