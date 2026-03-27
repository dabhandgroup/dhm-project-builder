import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, crawlData } = await req.json();
  if (!projectId || !crawlData) {
    return NextResponse.json({ error: "projectId and crawlData required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const path = `crawl-data/${projectId}.json`;

    // Store crawl data as JSON (strip screenshots to reduce size, store separately)
    const { pages, allUrls, domain } = crawlData;

    // Store full data (markdown, HTML, links, metadata) — screenshots stored separately
    const summaryData = {
      domain,
      allUrls,
      crawledAt: new Date().toISOString(),
      pages: pages.map((p: Record<string, unknown>) => ({
        url: p.url,
        markdown: p.markdown,
        html: p.html,
        links: p.links,
        metadata: p.metadata,
        hasScreenshot: !!p.screenshot,
      })),
    };

    const { error } = await admin.storage
      .from("project-assets")
      .upload(path, JSON.stringify(summaryData), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) throw error;

    // Store screenshots separately (they can be large)
    const screenshotPages = pages.filter((p: Record<string, unknown>) => p.screenshot);
    if (screenshotPages.length > 0) {
      const screenshotData = screenshotPages.map((p: Record<string, unknown>) => ({
        url: p.url,
        screenshot: p.screenshot,
      }));

      await admin.storage
        .from("project-assets")
        .upload(`crawl-data/${projectId}-screenshots.json`, JSON.stringify(screenshotData), {
          contentType: "application/json",
          upsert: true,
        });
    }

    // Build and store a ZIP of the full crawled site
    const zip = new JSZip();
    for (const page of pages as Record<string, unknown>[]) {
      let urlPath: string;
      try {
        urlPath = new URL(page.url as string).pathname.replace(/^\//, "") || "index";
      } catch {
        urlPath = "index";
      }
      urlPath = urlPath.replace(/\/$/, "");

      if (page.rawHtml || page.html) {
        zip.file(`${urlPath}/index.html`, (page.rawHtml || page.html) as string);
      }
      if (page.markdown) {
        zip.file(`${urlPath}/index.md`, page.markdown as string);
      }
      if (page.screenshot) {
        const base64Match = (page.screenshot as string).match(/^data:image\/\w+;base64,(.+)$/);
        if (base64Match) {
          zip.file(`${urlPath}/screenshot.png`, base64Match[1], { base64: true });
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await admin.storage
      .from("project-assets")
      .upload(`crawl-data/${projectId}-site.zip`, zipBuffer, {
        contentType: "application/zip",
        upsert: true,
      });

    return NextResponse.json({ success: true, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save crawl data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
