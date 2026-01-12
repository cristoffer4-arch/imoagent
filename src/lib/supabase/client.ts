import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Lazy-initialized browser client instance for client-side usage
let _supabaseBrowser: SupabaseClient | null = null

export function getSupabaseBrowser() {
  if (!_supabaseBrowser) {
    _supabaseBrowser = createClient()
  }
  return _supabaseBrowser
}

// Export as supabaseBrowser for backward compatibility
// Using Proxy with proper method binding to preserve 'this' context
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowser()
    const value = client[prop as keyof SupabaseClient]
    // Bind functions to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
