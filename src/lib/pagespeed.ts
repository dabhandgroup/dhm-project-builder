export interface PageSpeedResult {
  performanceScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
  interactive: number;
}

export async function runPageSpeedTest(
  url: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedResult | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ""}`;

  const res = await fetch(apiUrl);
  if (!res.ok) return null;

  const data = await res.json();
  const lighthouse = data.lighthouseResult;

  if (!lighthouse) return null;

  return {
    performanceScore: Math.round(
      (lighthouse.categories?.performance?.score ?? 0) * 100
    ),
    firstContentfulPaint:
      lighthouse.audits?.["first-contentful-paint"]?.numericValue ?? 0,
    largestContentfulPaint:
      lighthouse.audits?.["largest-contentful-paint"]?.numericValue ?? 0,
    totalBlockingTime:
      lighthouse.audits?.["total-blocking-time"]?.numericValue ?? 0,
    cumulativeLayoutShift:
      lighthouse.audits?.["cumulative-layout-shift"]?.numericValue ?? 0,
    speedIndex: lighthouse.audits?.["speed-index"]?.numericValue ?? 0,
    interactive: lighthouse.audits?.interactive?.numericValue ?? 0,
  };
}
