import { NextRequest, NextResponse } from "next/server";
import { generateContentPlan } from "@/lib/anthropic";
import { getAllSettings } from "@/lib/queries/settings";
import { getProjectById } from "@/lib/queries/projects";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName,
      businessType,
      targetAudience,
      locations,
      postsPerMonth,
      notes,
      projectId,
    } = body;

    if (!clientName || !businessType) {
      return NextResponse.json(
        { error: "Client name and business type are required" },
        { status: 400 },
      );
    }

    const settings = await getAllSettings();
    const anthropicKey = settings.anthropic_api_key;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured. Go to Settings." },
        { status: 400 },
      );
    }

    // If a project is assigned, load its content for context
    let existingSiteContent: string | undefined;
    if (projectId) {
      try {
        const project = await getProjectById(projectId);
        if (project?.brief) {
          existingSiteContent = `Project brief: ${project.brief}`;
        }
        if (project?.pages_required) {
          existingSiteContent =
            (existingSiteContent ?? "") +
            `\nRequired pages: ${project.pages_required}`;
        }
      } catch {
        // Non-fatal
      }
    }

    const plan = await generateContentPlan(anthropicKey, {
      clientName,
      businessType,
      targetAudience: targetAudience || "",
      locations: locations || "",
      postsPerMonth: Number(postsPerMonth) || 4,
      months: 3,
      notes,
      existingSiteContent,
    });

    return NextResponse.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate content plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
