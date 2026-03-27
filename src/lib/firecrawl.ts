const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

function getHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function validateFirecrawlKey(apiKey: string) {
  try {
    const res = await fetch(`${FIRECRAWL_API}/scrape`, {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        url: "https://example.com",
        formats: ["markdown"],
      }),
    });

    if (!res.ok) return { valid: false, error: "Invalid API key" };
    return { valid: true };
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

// ---------- Types ----------

export interface CrawlPage {
  url: string;
  markdown: string;
  html: string;
  rawHtml: string;
  links: string[];
  screenshot: string | null; // base64 data URI or URL
  metadata: {
    title?: string;
    description?: string;
    ogImage?: string;
    favicon?: string;
    [key: string]: unknown;
  };
}

export interface CrawlResult {
  pages: CrawlPage[];
  allUrls: string[];
}

export interface CrawlStatus {
  status: "scraping" | "completed" | "failed";
  total: number;
  completed: number;
  creditsUsed: number;
  expiresAt: string;
  data?: CrawlPage[];
}

// ---------- Map: discover all URLs ----------

export async function mapSite(
  apiKey: string,
  url: string,
): Promise<string[]> {
  const res = await fetch(`${FIRECRAWL_API}/map`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to map site");
  }

  const data = await res.json();
  return data.links ?? [];
}

// ---------- Full crawl: all formats ----------

export async function startCrawl(
  apiKey: string,
  url: string,
  maxPages = 50,
): Promise<string> {
  const res = await fetch(`${FIRECRAWL_API}/crawl`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      url,
      limit: maxPages,
      scrapeOptions: {
        formats: ["markdown", "html", "rawHtml", "screenshot", "links"],
        waitFor: 1000,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to start crawl");
  }

  const data = await res.json();
  return data.id;
}

export async function getCrawlStatus(
  apiKey: string,
  crawlId: string,
): Promise<CrawlStatus> {
  const res = await fetch(`${FIRECRAWL_API}/crawl/${crawlId}`, {
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    throw new Error("Failed to get crawl status");
  }

  const data = await res.json();

  const pages: CrawlPage[] = (data.data ?? []).map((page: Record<string, unknown>) => {
    const meta = (page.metadata ?? {}) as Record<string, unknown>;
    return {
      url: (meta.sourceURL as string) ?? (meta.url as string) ?? "",
      markdown: (page.markdown as string) ?? "",
      html: (page.html as string) ?? "",
      rawHtml: (page.rawHtml as string) ?? "",
      links: Array.isArray(page.links) ? page.links : [],
      screenshot: (page.screenshot as string) ?? null,
      metadata: {
        title: (meta.title as string) ?? undefined,
        description: (meta.description as string) ?? (meta.ogDescription as string) ?? undefined,
        ogImage: (meta.ogImage as string) ?? undefined,
        favicon: (meta.favicon as string) ?? undefined,
        ...meta,
      },
    };
  });

  return {
    status: data.status,
    total: data.total ?? 0,
    completed: data.completed ?? pages.length,
    creditsUsed: data.creditsUsed ?? 0,
    expiresAt: data.expiresAt ?? "",
    data: pages.length > 0 ? pages : undefined,
  };
}

// ---------- Full crawl with polling (legacy compat) ----------

export async function crawlSite(
  apiKey: string,
  url: string,
  maxPages = 10,
): Promise<{ pages: { url: string; markdown: string }[] }> {
  const crawlId = await startCrawl(apiKey, url, maxPages);

  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const status = await getCrawlStatus(apiKey, crawlId);

    if (status.status === "completed" && status.data) {
      return {
        pages: status.data.map((p) => ({
          url: p.url,
          markdown: p.markdown,
        })),
      };
    }

    if (status.status === "failed") {
      throw new Error("Crawl failed");
    }
  }

  throw new Error("Crawl timed out");
}

// ---------- Helpers ----------

function extractOldPaths(discoveredUrls: string[]): string[] {
  return discoveredUrls
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return u.startsWith("/") ? u : null;
      }
    })
    .filter((p): p is string => p !== null && p !== "/")
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .sort();
}

function matchNewPath(oldPath: string, newPagePaths: string[]): string {
  // Normalise: strip trailing slashes and .html extensions for comparison
  const normalise = (p: string) =>
    p.replace(/\/$/, "").replace(/\/index\.html$/, "").replace(/\.html$/, "") || "/";

  const norm = normalise(oldPath);

  // Direct match
  for (const np of newPagePaths) {
    if (normalise(np) === norm) return normalise(np) || "/";
  }

  // Partial match — last segment
  const lastSeg = norm.split("/").filter(Boolean).pop();
  if (lastSeg) {
    for (const np of newPagePaths) {
      const npNorm = normalise(np);
      if (npNorm.split("/").filter(Boolean).pop() === lastSeg) {
        return npNorm || "/";
      }
    }
  }

  return "/";
}

// ---------- Redirects generator ----------

export function generateRedirects(
  discoveredUrls: string[],
  domain: string,
  format: "netlify" | "vercel" = "netlify",
  newPagePaths: string[] = [],
): string | Record<string, unknown> {
  const paths = extractOldPaths(discoveredUrls);

  if (format === "vercel") {
    const redirects = paths.map((from) => ({
      source: from,
      destination: matchNewPath(from, newPagePaths),
      statusCode: 301,
    }));
    return { redirects };
  }

  // Netlify _redirects format
  const lines = [
    "# Redirects from old site URLs",
    "",
    ...paths.map((from) => `${from}    ${matchNewPath(from, newPagePaths)}    301`),
    "",
    "# Ad campaign redirects",
    "/ga/*    /    301",
    "/fb/*    /    301",
    "/ig/*    /    301",
    "/li/*    /    301",
    "/tt/*    /    301",
  ];
  return lines.join("\n");
}

// ---------- CSV redirect map ----------

export function generateRedirectsCsv(
  discoveredUrls: string[],
  domain: string,
  newPagePaths: string[] = [],
): string {
  const paths = extractOldPaths(discoveredUrls);
  const rows = [
    "old_url,old_path,new_path,status_code",
    ...paths.map((oldPath) => {
      const oldUrl = `https://${domain}${oldPath}`;
      const newPath = matchNewPath(oldPath, newPagePaths);
      return `${oldUrl},${oldPath},${newPath},301`;
    }),
  ];
  return rows.join("\n");
}
