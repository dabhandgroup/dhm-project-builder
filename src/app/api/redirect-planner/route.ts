import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list all saved redirect plans
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("redirect_plans")
    .select("id, name, original_url, new_url, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data });
}

// POST — create a new redirect plan
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from("redirect_plans")
    .insert({
      name: body.name,
      original_url: body.original_url,
      new_url: body.new_url,
      comments: body.comments || null,
      original_pages: body.original_pages || [],
      new_pages: body.new_pages || [],
      original_urls: body.original_urls || [],
      new_urls: body.new_urls || [],
      redirects: body.redirects || [],
      status: body.status || "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
