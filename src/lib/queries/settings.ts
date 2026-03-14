import { createClient } from "@/lib/supabase/server";

export async function getSetting(key: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) return null;
  return data?.value ?? null;
}

export async function getSettings(keys: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", keys);

  if (error) throw error;

  const result: Record<string, string | null> = {};
  for (const row of data) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getAllSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error) throw error;

  const result: Record<string, string | null> = {};
  for (const row of data) {
    result[row.key] = row.value;
  }
  return result;
}
