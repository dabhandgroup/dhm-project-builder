import { createClient } from "@/lib/supabase/server";

export async function getAudits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAuditById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
