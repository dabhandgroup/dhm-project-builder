import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("project-assets")
      .download(`crawl-data/${projectId}.json`);

    if (error || !data) {
      return NextResponse.json({ crawlData: null });
    }

    const text = await data.text();
    const crawlData = JSON.parse(text);
    return NextResponse.json({ crawlData });
  } catch {
    return NextResponse.json({ crawlData: null });
  }
}
