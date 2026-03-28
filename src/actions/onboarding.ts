"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  hasWebsite: boolean;
  websiteUrl: string;
  competitors: string[];
}

export async function submitOnboarding(data: OnboardingData) {
  const supabase = createAdminClient();

  const fullName = `${data.firstName} ${data.lastName}`.trim();

  // Create client record
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: fullName,
      email: data.email,
      company: data.businessName,
    })
    .select("id")
    .single();

  if (clientError) {
    return { error: clientError.message };
  }

  // Build brief from form data
  const briefParts: string[] = [];
  briefParts.push(`Business: ${data.businessName}`);
  briefParts.push(`Contact: ${fullName} (${data.email})`);
  if (data.hasWebsite && data.websiteUrl) {
    briefParts.push(`Existing website: ${data.websiteUrl}`);
  }
  if (data.competitors.length > 0) {
    briefParts.push(`Competitor sites they like:\n${data.competitors.map((c) => `  - ${c}`).join("\n")}`);
  }

  // Create project record
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      title: data.businessName,
      status: "lead",
      client_id: client.id,
      domain_name: data.hasWebsite ? data.websiteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "") : null,
      is_rebuild: data.hasWebsite,
      brief: briefParts.join("\n\n"),
      contact_info: {
        email: data.email,
      },
    })
    .select("id")
    .single();

  if (projectError) {
    return { error: projectError.message };
  }

  return { success: true, projectId: project.id };
}

export async function uploadOnboardingFile(
  projectId: string,
  fileName: string,
  fileBase64: string,
  contentType: string,
  folder: "logo" | "imagery"
) {
  const supabase = createAdminClient();

  const buffer = Buffer.from(fileBase64, "base64");
  const path = `${projectId}/${folder}-${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("project-assets")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { error: error.message };
  }

  return { success: true, path };
}
