import { NextResponse } from "next/server";
import { getAllSettings } from "@/lib/queries/settings";

export async function GET() {
  try {
    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
