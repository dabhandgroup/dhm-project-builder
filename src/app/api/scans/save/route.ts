import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPageImages } from "@/lib/image-extractor";
import JSZip from "jszip";
import { randomUUID } from "crypto";

export const maxDuration = 120;

async function fetchScreenshot(screenshot: string): Promise<Buffer | null> {
  try {
    const base64Match = screenshot.match(/^data:image\/\w+;base64,(.+)$/);
    if (base64Match) return Buffer.from(base64Match[1], "base64");
    if (screenshot.startsWith("http")) {
      const res = await fetch(screenshot);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    return null;
  } catch {
    return null;
  }
}

function urlToPath(url: string): string {
  try {
    const p = new URL(url).pathname.replace(/^\//, "") || "home";
    return p.replace(/\/$/, "") || "home";
  } catch {
    return "home";
  }
}

interface CrawlPage {
  url: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  screenshot?: string | null;
  mobileScreenshot?: string | null;
  links?: string[];
  metadata?: Record<string, unknown>;
}

interface CrawlData {
  pages: CrawlPage[];
  allUrls?: string[];
  domain?: string;
  crawledAt?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { crawlData } = (await req.json()) as { crawlData: CrawlData };
  if (!crawlData?.pages?.length) {
    return NextResponse.json({ error: "crawlData with pages is required" }, { status: 400 });
  }

  const scanId = randomUUID();
  const storageKey = `scans/${scanId}`;
  const domain = crawlData.domain || "unknown";
  const admin = createAdminClient();

  try {
    // Insert DB row
    const { error: dbError } = await admin
      .from("scans")
      .insert({
        id: scanId,
        user_id: user.id,
        domain,
        url: crawlData.pages[0]?.url || `https://${domain}`,
        page_count: crawlData.pages.length,
        image_count: 0,
        storage_key: storageKey,
      });

    if (dbError) throw dbError;

    // Process pages: download screenshots + extract images
    let totalImages = 0;
    const pageManifests: Record<string, unknown>[] = [];
    const allFiles: { path: string; data: Buffer | string }[] = [];

    // Sitemap
    if (crawlData.allUrls?.length) {
      allFiles.push({
        path: `${storageKey}/sitemap.txt`,
        data: crawlData.allUrls.join("\n"),
      });
    }

    // Process pages in batches of 5 for memory management
    for (let i = 0; i < crawlData.pages.length; i += 5) {
      const batch = crawlData.pages.slice(i, i + 5);

      const batchResults = await Promise.all(batch.map(async (page) => {
        const pagePath = urlToPath(page.url);
        const prefix = `${storageKey}/pages/${pagePath}`;
        const files: { path: string; data: Buffer | string }[] = [];

        // Markdown
        if (page.markdown) {
          files.push({ path: `${prefix}/content.md`, data: page.markdown });
        }

        // HTML source
        const htmlContent = page.rawHtml || page.html;
        if (htmlContent) {
          files.push({ path: `${prefix}/source.html`, data: htmlContent });
        }

        // Desktop screenshot
        if (page.screenshot) {
          const buf = await fetchScreenshot(page.screenshot);
          if (buf) files.push({ path: `${prefix}/screenshot-desktop.png`, data: buf });
        }

        // Mobile screenshot
        if (page.mobileScreenshot) {
          const buf = await fetchScreenshot(page.mobileScreenshot);
          if (buf) files.push({ path: `${prefix}/screenshot-mobile.png`, data: buf });
        }

        // Extract images from HTML
        const images = await extractPageImages(htmlContent || "", page.url);
        for (const img of images) {
          files.push({ path: `${prefix}/images/${img.filename}`, data: img.buffer });
        }

        const manifest = {
          url: page.url,
          path: pagePath,
          title: (page.metadata as Record<string, unknown>)?.title || null,
          hasMarkdown: !!page.markdown,
          hasHtml: !!htmlContent,
          hasDesktopScreenshot: !!page.screenshot,
          hasMobileScreenshot: !!page.mobileScreenshot,
          imageCount: images.length,
          imageFilenames: images.map((img) => img.filename),
        };

        return { files, manifest, imageCount: images.length };
      }));

      // Merge batch results into shared state (sequentially, no race)
      for (const result of batchResults) {
        allFiles.push(...result.files);
        pageManifests.push(result.manifest);
        totalImages += result.imageCount;
      }
    }

    // Save data.json manifest
    const manifest = {
      domain,
      url: crawlData.pages[0]?.url,
      allUrls: crawlData.allUrls || [],
      crawledAt: crawlData.crawledAt || new Date().toISOString(),
      pageCount: crawlData.pages.length,
      imageCount: totalImages,
      pages: pageManifests,
    };

    allFiles.push({
      path: `${storageKey}/data.json`,
      data: JSON.stringify(manifest),
    });

    // Build a single ZIP with everything
    const zip = new JSZip();
    for (const file of allFiles) {
      // Strip the storageKey prefix for ZIP paths
      const zipPath = file.path.replace(`${storageKey}/`, "");
      zip.file(zipPath, file.data);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Upload ZIP + manifest to storage
    await Promise.all([
      admin.storage
        .from("project-assets")
        .upload(`${storageKey}/all.zip`, zipBuffer, {
          contentType: "application/zip",
          upsert: true,
        }),
      admin.storage
        .from("project-assets")
        .upload(`${storageKey}/data.json`, JSON.stringify(manifest), {
          contentType: "application/json",
          upsert: true,
        }),
    ]);

    // Update image count in DB
    await admin
      .from("scans")
      .update({ image_count: totalImages })
      .eq("id", scanId);

    return NextResponse.json({ scanId, success: true });
  } catch (err) {
    // Clean up on failure
    await admin.from("scans").delete().eq("id", scanId);
    const message = err instanceof Error ? err.message : "Failed to save scan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
