import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const type = request.nextUrl.searchParams.get("type") || "build";

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  const storagePath = type === "crawl"
    ? `crawl-data/${projectId}-site.zip`
    : `builds/${projectId}.zip`;

  const { data, error } = await supabase.storage
    .from("project-assets")
    .download(storagePath);

  if (error || !data) {
    const msg = type === "crawl"
      ? "No crawled site files found. Crawl data may not have been saved."
      : "No build zip found. Run the pipeline first.";
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  const slug = (project?.title || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const suffix = type === "crawl" ? "-crawl" : "";
  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}${suffix}.zip"`,
    },
  });
}
