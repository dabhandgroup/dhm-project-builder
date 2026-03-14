"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSetting(key: string, value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("settings")
    .upsert(
      { key, value, updated_by: user?.id },
      { onConflict: "key" },
    );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function saveSettings(entries: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_by: user?.id,
  }));

  const { error } = await supabase
    .from("settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteSetting(key: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .delete()
    .eq("key", key);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
