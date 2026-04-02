import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Verify ownership
  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", id)
    .single();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Load data.json from storage
  const admin = createAdminClient();
  const { data: blob, error } = await admin.storage
    .from("project-assets")
    .download(`${scan.storage_key}/data.json`);

  if (error || !blob) {
    return NextResponse.json({ error: "Scan data not found in storage" }, { status: 404 });
  }

  const scanData = JSON.parse(await blob.text());
  return NextResponse.json({ scan, data: scanData });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", id)
    .single();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  // Delete storage files
  const { data: files } = await admin.storage
    .from("project-assets")
    .list(scan.storage_key);

  if (files?.length) {
    await admin.storage
      .from("project-assets")
      .remove(files.map((f) => `${scan.storage_key}/${f.name}`));
  }

  // Delete DB row
  await supabase.from("scans").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
