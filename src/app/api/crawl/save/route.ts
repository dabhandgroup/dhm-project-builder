import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    return NextResponse.json({ success: true, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save crawl data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
