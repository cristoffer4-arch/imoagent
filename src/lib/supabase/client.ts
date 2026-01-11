import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://demo.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "public-anon-key-not-for-production";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-placeholder";

export const supabaseBrowser: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { "x-imoagent-role": "browser" } },
  },
);

export const supabaseServiceRole: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-imoagent-role": "edge-service" } },
  },
);

export const SUPABASE_TABLES = [
  "profiles",
  "consultants",
  "properties",
  "leads",
  "commissions",
  "subscriptions",
  "payments",
  "appointments",
  "tasks",
  "documents",
  "storage_files",
  "coaching_sessions",
  "kpi_snapshots",
  "competitions",
  "notifications",
];
