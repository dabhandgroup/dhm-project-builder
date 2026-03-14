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

export async function crawlSite(
  apiKey: string,
  url: string,
  maxPages = 10,
): Promise<{ pages: { url: string; markdown: string }[] }> {
  // Start crawl
  const startRes = await fetch(`${FIRECRAWL_API}/crawl`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      url,
      limit: maxPages,
      scrapeOptions: {
        formats: ["markdown"],
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.json();
    throw new Error(err.error || "Failed to start crawl");
  }

  const { id } = await startRes.json();

  // Poll for results
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(`${FIRECRAWL_API}/crawl/${id}`, {
      headers: getHeaders(apiKey),
    });

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();

    if (statusData.status === "completed") {
      return {
        pages: (statusData.data ?? []).map(
          (page: { metadata?: { sourceURL?: string }; markdown?: string }) => ({
            url: page.metadata?.sourceURL ?? "",
            markdown: page.markdown ?? "",
          }),
        ),
      };
    }

    if (statusData.status === "failed") {
      throw new Error("Crawl failed");
    }
  }

  throw new Error("Crawl timed out");
}
