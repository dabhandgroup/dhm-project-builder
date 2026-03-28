import { createClient } from "@/lib/supabase/client";

type Bucket = "project-assets" | "avatars" | "audio" | "reports" | "templates";

export async function uploadFile(
  bucket: Bucket,
  path: string,
  file: File,
) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

  if (error) throw error;
  return data.path;
}

export async function deleteFile(bucket: Bucket, path: string) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function getPublicUrl(bucket: Bucket, path: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProjectImage(
  projectId: string,
  file: File,
  imageType: "square" | "landscape",
) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${projectId}/${imageType}-${Date.now()}.${ext}`;
  await uploadFile("project-assets", path, file);
  return getPublicUrl("project-assets", path);
}

export async function uploadProjectAsset(
  projectId: string,
  file: File,
  assetType: "favicon" | "og-image" | "logo" | "alt-logo",
) {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${projectId}/${assetType}.${ext}`;
  await uploadFile("project-assets", path, file);
  return getPublicUrl("project-assets", path);
}

export async function uploadFaviconVariants(
  projectId: string,
  variants: { name: string; blob: Blob }[],
) {
  const urls: Record<string, string> = {};
  for (const variant of variants) {
    const path = `${projectId}/favicon/${variant.name}`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("project-assets")
      .upload(path, variant.blob, {
        upsert: true,
        contentType: "image/png",
      });
    if (!error) {
      urls[variant.name] = getPublicUrl("project-assets", path);
    }
  }
  return urls;
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  await uploadFile("avatars", path, file);
  return getPublicUrl("avatars", path);
}

export async function uploadAudio(userId: string, file: File | Blob) {
  const path = `${userId}/${Date.now()}.webm`;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("audio")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return data.path;
}
