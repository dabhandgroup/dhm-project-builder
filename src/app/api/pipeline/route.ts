import { NextRequest, NextResponse } from "next/server";
import { runPipeline, getPipelineStatus } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  const { projectId } = await request.json();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Check if pipeline is already running
  const current = getPipelineStatus(projectId);
  if (current && !["complete", "failed"].includes(current.step)) {
    return NextResponse.json({ error: "Pipeline already running" }, { status: 409 });
  }

  // Start pipeline in background (don't await)
  runPipeline(projectId).catch(console.error);

  return NextResponse.json({ started: true });
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const status = getPipelineStatus(projectId);

  if (!status) {
    return NextResponse.json({ step: "idle", message: "No pipeline running" });
  }

  return NextResponse.json(status);
}
