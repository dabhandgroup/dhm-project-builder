"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const phone = formData.get("phone") as string | null;
  const company = formData.get("company") as string | null;
  const address = formData.get("address") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!name) return { error: "Client name is required" };

  const { error } = await supabase.from("clients").insert({
    name,
    email: email || null,
    phone: phone || null,
    company: company || null,
    address: address || null,
    notes: notes || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  redirect("/clients");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: (formData.get("company") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };
  redirect(`/clients/${clientId}`);
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);
  redirect("/clients");
}
