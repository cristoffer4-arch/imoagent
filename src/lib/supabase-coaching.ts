import { getSupabaseBrowser } from './supabase/client';

// Helper functions for coaching module

export async function getGoals(userId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertGoal(goal: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('goals')
    .upsert(goal)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getKPIs(userId: string, startDate?: string, endDate?: string) {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from('kpis')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function upsertKPI(kpi: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('kpis')
    .upsert(kpi)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCoachingSessions(userId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createCoachingSession(session: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('coaching_sessions')
    .insert(session)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCoachingSession(id: string, updates: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('coaching_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getActionItems(userId: string, status?: string) {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from('action_items')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });
  
  if (status) query = query.eq('status', status);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function upsertActionItem(item: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('action_items')
    .upsert(item)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getDISCProfile(userId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('disc_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertDISCProfile(profile: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('disc_profiles')
    .upsert(profile)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserStats(userId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from('user_stats')
    .select('*, achievements(*)')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
