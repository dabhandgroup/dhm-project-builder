import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/queries/settings";

export const maxDuration = 60;

interface RedirectMapping {
  from: string;
  to: string;
  status_code: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anthropicKey = await getSetting("anthropic_api_key");
  if (!anthropicKey) {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 400 });
  }

  const body = await req.json();
  const { originalUrls, newUrls, originalPages, newPages, comments } = body;

  // Build context about the pages
  const originalSummary = (originalPages || [])
    .slice(0, 30)
    .map((p: { url: string; title?: string }) => {
      try {
        const path = new URL(p.url).pathname;
        return `  ${path} — ${p.title || "(no title)"}`;
      } catch {
        return `  ${p.url}`;
      }
    })
    .join("\n");

  const newSummary = (newPages || [])
    .slice(0, 30)
    .map((p: { url: string; title?: string }) => {
      try {
        const path = new URL(p.url).pathname;
        return `  ${path} — ${p.title || "(no title)"}`;
      } catch {
        return `  ${p.url}`;
      }
    })
    .join("\n");

  const originalPaths = (originalUrls || []).map((u: string) => {
    try { return new URL(u).pathname; } catch { return u; }
  }).filter((p: string) => p !== "/").join("\n  ");

  const newPaths = (newUrls || []).map((u: string) => {
    try { return new URL(u).pathname; } catch { return u; }
  }).filter((p: string) => p !== "/").join("\n  ");

  const systemPrompt = `You are a web migration specialist. Generate 301 redirect mappings from an old site to a new site.

CRITICAL: Return ONLY a raw JSON array. No markdown fences, no explanation.
Each object must have: "from" (old path), "to" (new path), "status_code" (301 or 410), "reason" (brief explanation).

Rules:
- Map every old URL to the most appropriate new URL based on content/purpose
- If a page has a direct equivalent, use 301
- If a page is intentionally removed with no equivalent, use 410 (Gone)
- Always use paths (e.g. /about), not full URLs
- Skip the root path /
- Consider the page titles and content context when matching
- Group similar pages logically`;

  const userPrompt = `Map redirects from the OLD site to the NEW site.

OLD SITE pages with titles:
${originalSummary}

OLD SITE all paths:
  ${originalPaths}

NEW SITE pages with titles:
${newSummary}

NEW SITE all paths:
  ${newPaths}

${comments ? `USER NOTES (factor these in):\n${comments}` : ""}

Return a JSON array of redirect objects.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: "[" },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || "AI generation failed" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = "[" + (data.content?.[0]?.text ?? "[]");

    let redirects: RedirectMapping[];
    try {
      redirects = JSON.parse(text);
    } catch {
      // Try to extract JSON array from response
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        redirects = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
    }

    return NextResponse.json({ redirects });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
