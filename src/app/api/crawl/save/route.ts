import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JSZip from "jszip";

export const maxDuration = 60;

// Download a screenshot URL and return the image buffer, or decode base64
async function fetchScreenshot(screenshot: string): Promise<Buffer | null> {
  try {
    // Handle base64 data URIs
    const base64Match = screenshot.match(/^data:image\/\w+;base64,(.+)$/);
    if (base64Match) {
      return Buffer.from(base64Match[1], "base64");
    }
    // Handle URLs
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
    let p = new URL(url).pathname.replace(/^\//, "") || "home";
    return p.replace(/\/$/, "") || "home";
  } catch {
    return "home";
  }
}

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

    const { pages, allUrls, domain } = crawlData;

    // Download all screenshots in parallel (desktop + mobile URLs → buffers)
    const desktopScreenshots = new Map<string, Buffer>();
    const mobileScreenshots = new Map<string, Buffer>();

    await Promise.allSettled(
      pages.flatMap((p: Record<string, unknown>) => {
        const tasks: Promise<void>[] = [];
        if (p.screenshot) {
          tasks.push(
            fetchScreenshot(p.screenshot as string).then((buf) => {
              if (buf) desktopScreenshots.set(p.url as string, buf);
            }),
          );
        }
        if (p.mobileScreenshot) {
          tasks.push(
            fetchScreenshot(p.mobileScreenshot as string).then((buf) => {
              if (buf) mobileScreenshots.set(p.url as string, buf);
            }),
          );
        }
        return tasks;
      }),
    );

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
        hasScreenshot: desktopScreenshots.has(p.url as string),
        hasMobileScreenshot: mobileScreenshots.has(p.url as string),
      })),
    };

    const { error } = await admin.storage
      .from("project-assets")
      .upload(path, JSON.stringify(summaryData), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) throw error;

    // Build screenshots ZIP with desktop + mobile folders
    const hasAnyScreenshots = desktopScreenshots.size > 0 || mobileScreenshots.size > 0;
    if (hasAnyScreenshots) {
      const ssZip = new JSZip();
      for (const [url, buf] of desktopScreenshots) {
        const pagePath = urlToPath(url);
        ssZip.file(`desktop/${pagePath}/screenshot.png`, buf);
      }
      for (const [url, buf] of mobileScreenshots) {
        const pagePath = urlToPath(url);
        ssZip.file(`mobile/${pagePath}/screenshot.png`, buf);
      }
      const ssZipBuffer = await ssZip.generateAsync({ type: "nodebuffer" });
      await admin.storage
        .from("project-assets")
        .upload(`crawl-data/${projectId}-screenshots.zip`, ssZipBuffer, {
          contentType: "application/zip",
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
      const desktopBuf = desktopScreenshots.get(page.url as string);
      if (desktopBuf) {
        zip.file(`${urlPath}/screenshot-desktop.png`, desktopBuf);
      }
      const mobileBuf = mobileScreenshots.get(page.url as string);
      if (mobileBuf) {
        zip.file(`${urlPath}/screenshot-mobile.png`, mobileBuf);
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
