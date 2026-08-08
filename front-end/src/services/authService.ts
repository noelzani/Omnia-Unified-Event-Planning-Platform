import { supabase } from "../lib/supabase";

// SIGN UP
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// SIGN IN
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// GET USER ROLE
export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("role_id")
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return data.role_id;
}

// SIGN OUT
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}