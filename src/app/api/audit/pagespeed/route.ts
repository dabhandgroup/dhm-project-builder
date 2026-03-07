import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function runPageSpeedTest(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${apiKey ? `&key=${apiKey}` : ""}`;

  const res = await fetch(apiUrl);
  if (!res.ok) return null;

  const data = await res.json();
  const lighthouse = data.lighthouseResult;

  if (!lighthouse) return null;

  return {
    performanceScore: Math.round((lighthouse.categories?.performance?.score ?? 0) * 100),
    firstContentfulPaint: lighthouse.audits?.["first-contentful-paint"]?.numericValue ?? 0,
    largestContentfulPaint: lighthouse.audits?.["largest-contentful-paint"]?.numericValue ?? 0,
    totalBlockingTime: lighthouse.audits?.["total-blocking-time"]?.numericValue ?? 0,
    cumulativeLayoutShift: lighthouse.audits?.["cumulative-layout-shift"]?.numericValue ?? 0,
    speedIndex: lighthouse.audits?.["speed-index"]?.numericValue ?? 0,
    interactive: lighthouse.audits?.interactive?.numericValue ?? 0,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentUrl, newUrl } = await request.json();
  if (!currentUrl || !newUrl) {
    return NextResponse.json({ error: "Both URLs required" }, { status: 400 });
  }

  // Create audit record
  const { data: audit, error } = await supabase
    .from("audits")
    .insert({
      current_url: currentUrl,
      new_url: newUrl,
      status: "running_before",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !audit) {
    return NextResponse.json({ error: "Failed to create audit" }, { status: 500 });
  }

  // Run tests (non-blocking in production, but synchronous here for simplicity)
  try {
    const beforeResult = await runPageSpeedTest(currentUrl);
    await supabase
      .from("audits")
      .update({ pagespeed_before: beforeResult, status: "running_after" })
      .eq("id", audit.id);

    const afterResult = await runPageSpeedTest(newUrl);
    await supabase
      .from("audits")
      .update({
        pagespeed_after: afterResult,
        status: "complete",
        completed_at: new Date().toISOString(),
      })
      .eq("id", audit.id);
  } catch {
    await supabase
      .from("audits")
      .update({ status: "failed" })
      .eq("id", audit.id);
  }

  return NextResponse.json({ id: audit.id });
}
