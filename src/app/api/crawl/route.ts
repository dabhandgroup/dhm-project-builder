import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/queries/settings";
import { mapSite, startBatchScrape, startCrawl } from "@/lib/firecrawl";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, maxPages = 200, projectId, mobile } = await req.json();
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

    // Use batch scrape with discovered URLs for reliable multi-page scraping.
    // The crawl endpoint follows links which can miss pages on JS-heavy sites.
    const urlsToScrape = allUrls.slice(0, maxPages);

    // If map found URLs, batch scrape them; otherwise fall back to crawl
    if (urlsToScrape.length > 0) {
      const batchId = await startBatchScrape(apiKey, urlsToScrape, { mobile: !!mobile });
      return NextResponse.json({
        crawlId: batchId,
        type: "batch",
        allUrls,
        projectId,
        totalUrls: allUrls.length,
      });
    }

    // Fallback: use crawl endpoint if map returned nothing
    const crawlId = await startCrawl(apiKey, url, maxPages, { mobile: !!mobile });
    return NextResponse.json({
      crawlId,
      type: "crawl",
      allUrls,
      projectId,
      totalUrls: allUrls.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Crawl failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
