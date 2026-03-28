import { NextRequest, NextResponse } from "next/server";
import { deployProject, getPipelineStatus } from "@/lib/pipeline";

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

  // Start deploy in background
  deployProject(projectId).catch(console.error);

  return NextResponse.json({ started: true });
}
