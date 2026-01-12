import { supabaseBrowser } from "@/lib/supabase/client";

export type SessionUser = {
  id: string;
  email?: string;
  role?: string | null;
};

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  const { data, error } = await supabaseBrowser.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabaseBrowser.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabaseBrowser.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabaseBrowser
    .from("profiles")
    .select("id, full_name, role, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId: string, payload: Record<string, unknown>) {
  const { error } = await supabaseBrowser.from("profiles").upsert({ id: userId, ...payload });
  if (error) throw error;
  return true;
}

