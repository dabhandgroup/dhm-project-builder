import { createAdminClient } from "@/lib/supabase/admin";

interface ProjectImage {
  path: string;
  base64: string;
}

function getExtension(url: string): string {
  // Strip query params, then get extension
  const cleanUrl = url.split("?")[0];
  const ext = cleanUrl.substring(cleanUrl.lastIndexOf(".") + 1).toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
}

export async function loadProjectImages(
  projectId: string,
): Promise<ProjectImage[]> {
  const supabase = createAdminClient();

  const { data: images, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error || !images?.length) return [];

  const results: ProjectImage[] = [];
  const counters = { square: 0, landscape: 0 };

  for (const image of images) {
    try {
      const res = await fetch(image.image_url);
      if (!res.ok) continue;

      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const ext = getExtension(image.image_url);

      const type = image.image_type as "square" | "landscape";
      counters[type]++;
      const path = `images/${type}/photo-${counters[type]}.${ext}`;

      results.push({ path, base64 });
    } catch {
      // Skip images that fail to download
      continue;
    }
  }

  return results;
}

export function getImageManifest(images: { path: string }[]): string {
  if (images.length === 0) return "";

  const lines = images.map((img) => `- ${img.path}`);
  return `Available project images (use these exact paths in <img src="..."> tags):\n${lines.join("\n")}`;
}
