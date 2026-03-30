import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/queries/settings";
import { mapSite, startCrawl } from "@/lib/firecrawl";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, maxPages = 50, projectId, mobile } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const apiKey = await getSetting("firecrawl_api_key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Firecrawl API key not configured. Go to Settings." },
      { status: 400 },
    );
  }

  try {
    // First, map the site to discover all URLs
    const allUrls = await mapSite(apiKey, url);

    // Start the full crawl with all formats (desktop or mobile)
    const crawlId = await startCrawl(apiKey, url, maxPages, { mobile: !!mobile });

    return NextResponse.json({
      crawlId,
      allUrls,
      projectId,
      totalUrls: allUrls.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Crawl failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
