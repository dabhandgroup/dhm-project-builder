"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCost(data: {
  description: string;
  amount: number;
  currency?: string;
  type?: string;
  date?: string;
  project_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("costs")
    .insert({ ...data, created_by: user?.id });

  if (error) return { error: error.message };

  revalidatePath("/financials");
  return { success: true };
}

export async function updateCost(id: string, data: {
  description?: string;
  amount?: number;
  currency?: string;
  type?: string;
  date?: string;
  project_id?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("costs")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/financials");
  return { success: true };
}

export async function deleteCost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("costs")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/financials");
  return { success: true };
}

export async function upsertFinancialTarget(data: {
  id?: string;
  currency: string;
  monthly_mrr_target: number;
  monthly_one_off_target: number;
  label?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("financial_targets")
    .upsert({
      ...data,
      updated_by: user?.id,
    });

  if (error) return { error: error.message };

  revalidatePath("/financials");
  revalidatePath("/financials/targets");
  return { success: true };
}
