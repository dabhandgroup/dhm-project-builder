import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Proxy for serving files from Supabase storage buckets.
 * Usage: /api/storage?bucket=project-assets&path=template-thumbnails/123-image.webp
 */
export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get("bucket");
  const path = req.nextUrl.searchParams.get("path");

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
  }

  // Only allow known buckets
  const allowedBuckets = ["project-assets", "templates", "avatars"];
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error || !data) {
      console.error("Storage proxy error:", error?.message ?? "No data returned", { bucket, path });
      return NextResponse.json(
        { error: error?.message ?? "File not found" },
        { status: 404 }
      );
    }

    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      svg: "image/svg+xml",
      gif: "image/gif",
    };

    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeTypes[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Storage proxy unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
