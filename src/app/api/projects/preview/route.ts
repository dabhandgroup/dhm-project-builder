import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";

// Cache extracted ZIPs in memory to avoid re-downloading on every asset request
const zipCache = new Map<string, { zip: JSZip; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getZip(projectId: string): Promise<JSZip | null> {
  const cached = zipCache.get(projectId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.zip;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("project-assets")
    .download(`builds/${projectId}.zip`);

  if (error || !data) return null;

  const zip = await JSZip.loadAsync(await data.arrayBuffer());
  zipCache.set(projectId, { zip, ts: Date.now() });
  return zip;
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function getMimeType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const filePath = req.nextUrl.searchParams.get("file") || "index.html";

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zip = await getZip(projectId);
  if (!zip) {
    return new NextResponse("Build not found. Run the pipeline first.", { status: 404 });
  }

  // Try exact path, then with index.html appended
  let file = zip.file(filePath);
  if (!file && !filePath.endsWith(".html")) {
    file = zip.file(`${filePath}/index.html`) || zip.file(`${filePath}.html`);
  }

  if (!file) {
    // For HTML files, return the main index.html as fallback (SPA-style)
    if (filePath.endsWith(".html") || !filePath.includes(".")) {
      file = zip.file("index.html");
    }
  }

  if (!file) {
    return new NextResponse("File not found", { status: 404 });
  }

  const content = await file.async("uint8array");
  const contentType = getMimeType(file.name);

  // For HTML files, rewrite relative asset paths to go through this preview route
  if (contentType.startsWith("text/html")) {
    let html = new TextDecoder().decode(content);
    // Rewrite relative paths to absolute preview API paths
    const base = `/api/projects/preview?projectId=${projectId}&file=`;
    html = html.replace(/(href|src|action)="(?!https?:\/\/|\/\/|data:|mailto:|tel:|#)([^"]+)"/g, (match, attr, path) => {
      // Resolve relative path
      const resolved = path.startsWith("/") ? path.slice(1) : path;
      return `${attr}="${base}${encodeURIComponent(resolved)}"`;
    });
    return new NextResponse(html, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
      },
    });
  }

  return new NextResponse(Buffer.from(content), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
