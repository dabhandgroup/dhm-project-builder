import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";

const TEXT_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".json", ".svg", ".txt", ".xml", ".md",
  ".htm", ".jsx", ".ts", ".tsx", ".scss", ".less", ".yml", ".yaml",
]);

function isTextFile(path: string): boolean {
  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export async function loadTemplateFiles(
  storagePath: string,
): Promise<{ path: string; content: string }[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("templates")
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download template: ${error?.message || "No data"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const files: { path: string; content: string }[] = [];

  // Detect if ZIP has a single root folder (common pattern)
  const allPaths = Object.keys(zip.files);
  const topLevelDirs = new Set(
    allPaths.map((p) => p.split("/")[0]).filter(Boolean),
  );
  const singleRoot =
    topLevelDirs.size === 1 && zip.files[`${[...topLevelDirs][0]}/`]?.dir;
  const stripPrefix = singleRoot ? `${[...topLevelDirs][0]}/` : "";

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    // Skip directories
    if (zipEntry.dir) continue;

    // Skip macOS artifacts and hidden files
    if (relativePath.includes("__MACOSX") || relativePath.split("/").some((s) => s.startsWith("."))) {
      continue;
    }

    // Only extract text files
    if (!isTextFile(relativePath)) continue;

    const content = await zipEntry.async("string");

    // Normalize path by stripping single root folder
    let normalizedPath = relativePath;
    if (stripPrefix && normalizedPath.startsWith(stripPrefix)) {
      normalizedPath = normalizedPath.slice(stripPrefix.length);
    }

    if (normalizedPath) {
      files.push({ path: normalizedPath, content });
    }
  }

  return files;
}
