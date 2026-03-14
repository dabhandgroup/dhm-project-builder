import { NextResponse } from "next/server";
import { getFinancialSummary } from "@/lib/queries/financials";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getFinancialSummary();
  return NextResponse.json(summary);
}
