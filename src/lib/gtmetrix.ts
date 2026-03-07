const GTMETRIX_API = "https://gtmetrix.com/api/2.0";

function getHeaders() {
  const apiKey = process.env.GTMETRIX_API_KEY ?? "";
  return {
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

export async function startGTmetrixTest(url: string): Promise<string | null> {
  const res = await fetch(`${GTMETRIX_API}/tests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ url }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.data?.id ?? null;
}

export async function getGTmetrixResult(testId: string) {
  const res = await fetch(`${GTMETRIX_API}/tests/${testId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const attrs = data.data?.attributes;

  if (!attrs || attrs.state !== "completed") {
    return { state: attrs?.state ?? "unknown", data: null };
  }

  return {
    state: "completed",
    data: {
      grade: attrs.gtmetrix_grade ?? "?",
      performanceScore: attrs.performance_score ?? 0,
      structureScore: attrs.structure_score ?? 0,
      lcp: attrs.lcp ?? 0,
      tbt: attrs.tbt ?? 0,
      cls: attrs.cls ?? 0,
      pageLoadTime: attrs.page_load_time ?? 0,
      totalPageSize: attrs.page_bytes ?? 0,
      totalRequests: attrs.page_requests ?? 0,
    },
  };
}
