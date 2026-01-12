import { createServiceRoleClient } from "@/lib/supabase/server";

// Server-side auth functions that require service role access
// These functions can only be called from server components, API routes, or server actions

export async function getProfile(userId: string) {
  const supabaseServiceRole = createServiceRoleClient();
  const { data, error } = await supabaseServiceRole
    .from("profiles")
    .select("id, full_name, role, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId: string, payload: Record<string, unknown>) {
  const supabaseServiceRole = createServiceRoleClient();
  const { error } = await supabaseServiceRole.from("profiles").upsert({ id: userId, ...payload });
  if (error) throw error;
  return true;
}
