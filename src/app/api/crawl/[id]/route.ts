import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/queries/settings";
import { getCrawlStatus } from "@/lib/firecrawl";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const apiKey = await getSetting("firecrawl_api_key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Firecrawl API key not configured" },
      { status: 400 },
    );
  }

  try {
    const status = await getCrawlStatus(apiKey, id);
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
