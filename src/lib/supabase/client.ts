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
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseBrowser()[prop as keyof SupabaseClient]
  }
})
