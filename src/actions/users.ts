"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateProfile(userId: string, data: {
  full_name?: string;
  avatar_url?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: "admin" | "member") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}
