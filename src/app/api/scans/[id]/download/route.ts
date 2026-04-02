import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JSZip from "jszip";

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const type = req.nextUrl.searchParams.get("type") || "all";

  // Verify ownership
  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", id)
    .single();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const storageKey = scan.storage_key;

  // For "all" type, serve the pre-built ZIP
  if (type === "all") {
    const { data, error } = await admin.storage
      .from("project-assets")
      .download(`${storageKey}/all.zip`);

    if (error || !data) {
      return NextResponse.json({ error: "Download not available" }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${scan.domain}-all.zip"`,
      },
    });
  }

  // For "sitemap", serve plain text
  if (type === "sitemap") {
    const { data, error } = await admin.storage
      .from("project-assets")
      .download(`${storageKey}/sitemap.txt`);

    if (error || !data) {
      return NextResponse.json({ error: "Sitemap not available" }, { status: 404 });
    }

    const text = await data.text();
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${scan.domain}-sitemap.txt"`,
      },
    });
  }

  // For other types, load the manifest and build a filtered ZIP
  const { data: manifestBlob, error: mErr } = await admin.storage
    .from("project-assets")
    .download(`${storageKey}/data.json`);

  if (mErr || !manifestBlob) {
    return NextResponse.json({ error: "Scan data not found" }, { status: 404 });
  }

  const manifest = JSON.parse(await manifestBlob.text()) as {
    domain: string;
    pages: { path: string; title?: string; hasMarkdown: boolean; hasHtml: boolean; hasDesktopScreenshot: boolean; hasMobileScreenshot: boolean; imageCount: number; imageFilenames: string[] }[];
  };

  // Load the all.zip and filter it
  const { data: allZipBlob, error: zErr } = await admin.storage
    .from("project-assets")
    .download(`${storageKey}/all.zip`);

  if (zErr || !allZipBlob) {
    return NextResponse.json({ error: "ZIP not available" }, { status: 404 });
  }

  const sourceZip = await JSZip.loadAsync(await allZipBlob.arrayBuffer());
  const outputZip = new JSZip();

  for (const page of manifest.pages) {
    const prefix = `pages/${page.path}`;

    if (type === "content" && page.hasMarkdown) {
      const file = sourceZip.file(`${prefix}/content.md`);
      if (file) outputZip.file(`${page.path}/content.md`, await file.async("nodebuffer"));
    }

    if (type === "html" && page.hasHtml) {
      const file = sourceZip.file(`${prefix}/source.html`);
      if (file) outputZip.file(`${page.path}/source.html`, await file.async("nodebuffer"));
    }

    if (type === "screenshots") {
      if (page.hasDesktopScreenshot) {
        const file = sourceZip.file(`${prefix}/screenshot-desktop.png`);
        if (file) outputZip.file(`desktop/${page.path}.png`, await file.async("nodebuffer"));
      }
      if (page.hasMobileScreenshot) {
        const file = sourceZip.file(`${prefix}/screenshot-mobile.png`);
        if (file) outputZip.file(`mobile/${page.path}.png`, await file.async("nodebuffer"));
      }
    }

    if (type === "images" && page.imageCount > 0) {
      for (const filename of page.imageFilenames) {
        const file = sourceZip.file(`${prefix}/images/${filename}`);
        if (file) outputZip.file(`${page.path}/${filename}`, await file.async("nodebuffer"));
      }
    }
  }

  const zipBuffer = Buffer.from(await outputZip.generateAsync({ type: "nodebuffer" }));
  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${scan.domain}-${type}.zip"`,
    },
  });
}
