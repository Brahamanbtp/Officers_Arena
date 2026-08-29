import { supabase, SupabaseClient } from "./client";

export function createServerSupabaseClient(): SupabaseClient {
  return supabase;
}
