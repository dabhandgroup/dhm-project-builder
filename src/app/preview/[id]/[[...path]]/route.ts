import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JSZip from "jszip";

// Cache extracted ZIPs in memory to avoid re-downloading on every asset request
const zipCache = new Map<string, { zip: JSZip; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getZip(projectId: string): Promise<JSZip | null> {
  const cached = zipCache.get(projectId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.zip;
  }

  const supabase = createAdminClient();
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const { id: projectId, path: pathSegments } = await params;
  const filePath = pathSegments?.join("/") || "index.html";

  const zip = await getZip(projectId);
  if (!zip) {
    return new NextResponse(
      "<html><body style='font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#666'><div style='text-align:center'><h2>Preview Not Available</h2><p>This site hasn&apos;t been built yet.</p></div></body></html>",
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Try exact path, then with index.html appended
  let file = zip.file(filePath);
  if (!file && !filePath.endsWith(".html")) {
    file = zip.file(`${filePath}/index.html`) || zip.file(`${filePath}.html`);
  }

  if (!file) {
    // For HTML files / routes, return the main index.html as fallback (SPA-style)
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
    const base = `/preview/${projectId}/`;
    html = html.replace(
      /(href|src|action)="(?!https?:\/\/|\/\/|data:|mailto:|tel:|#)([^"]+)"/g,
      (_match, attr, path) => {
        const resolved = path.startsWith("/") ? path.slice(1) : path;
        return `${attr}="${base}${resolved}"`;
      }
    );
    return new NextResponse(html, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
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
