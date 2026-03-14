import { NextResponse } from "next/server";
import { getClients } from "@/lib/queries/clients";
import { getTemplates } from "@/lib/queries/templates";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [clients, templates] = await Promise.all([getClients(), getTemplates()]);

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      address: c.address,
    })),
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      thumbnail_url: t.thumbnail_url,
      category: t.category,
      framework: t.framework,
    })),
  });
}
