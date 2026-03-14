"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createVoiceMemo(data: {
  transcription: string;
  summary?: string;
  project_id?: string | null;
  source_field?: string;
  audio_url?: string;
  duration_seconds?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memo, error } = await supabase
    .from("voice_memos")
    .insert({ ...data, created_by: user?.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/voice-memos");
  revalidatePath("/notes");
  return { id: memo.id };
}

export async function deleteVoiceMemo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("voice_memos")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/voice-memos");
  revalidatePath("/notes");
  return { success: true };
}
