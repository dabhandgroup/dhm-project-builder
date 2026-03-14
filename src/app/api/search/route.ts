import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, domain_name, clients(name)")
    .or(`title.ilike.%${q}%,domain_name.ilike.%${q}%`)
    .limit(10);

  const results = (projects ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    domain_name: p.domain_name,
    client_name: Array.isArray(p.clients) ? p.clients[0]?.name : (p.clients as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json(results);
}
