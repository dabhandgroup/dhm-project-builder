const ANTHROPIC_API = "https://api.anthropic.com/v1";

// Rough token estimate: ~4 chars per token
const CHARS_PER_TOKEN = 4;
const MAX_EXISTING_CONTENT_CHARS = 30_000; // ~7,500 tokens
const MAX_TEMPLATE_CHARS = 80_000; // ~20,000 tokens
const MAX_SINGLE_FILE_CHARS = 20_000; // ~5,000 tokens per file

function getHeaders(apiKey: string) {
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  };
}

export async function validateAnthropicKey(apiKey: string) {
  try {
    const res = await fetch(`${ANTHROPIC_API}/messages`, {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { valid: false, error: err.error?.message || "Invalid API key" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

/**
 * Truncate text to a character limit, appending a notice if truncated.
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n...[truncated]";
}

/**
 * Compress crawled site content: keep headings, nav items, and key text.
 * Strips redundant whitespace and limits total size.
 */
function compressSiteContent(raw: string): string {
  // Collapse excessive whitespace / blank lines
  let compressed = raw.replace(/\n{3,}/g, "\n\n").trim();
  return truncate(compressed, MAX_EXISTING_CONTENT_CHARS);
}

/**
 * Trim template files to fit within the token budget.
 * Prioritises smaller files (config, HTML pages) over large vendored assets.
 */
function trimTemplateFiles(
  files: { path: string; content: string }[],
): { path: string; content: string }[] {
  // Sort: shorter files first so we keep more of them
  const sorted = [...files].sort(
    (a, b) => a.content.length - b.content.length,
  );

  const result: { path: string; content: string }[] = [];
  let totalChars = 0;

  for (const f of sorted) {
    // Skip vendored / minified assets that Claude can't usefully read
    if (
      f.path.match(/\.(min\.(js|css)|map|lock|woff2?|ttf|eot|svg|png|jpg|gif|ico)$/)
    ) {
      continue;
    }

    const content = truncate(f.content, MAX_SINGLE_FILE_CHARS);
    if (totalChars + content.length > MAX_TEMPLATE_CHARS) break;

    result.push({ path: f.path, content });
    totalChars += content.length;
  }

  return result;
}

export async function generateSiteFiles(
  apiKey: string,
  opts: {
    templateFiles: { path: string; content: string }[];
    brief: string;
    clientName: string;
    existingSiteContent?: string;
    imagePaths?: string[];
    oldSitePages?: { url: string; title: string }[];
  },
): Promise<{ path: string; content: string }[]> {
  const systemPrompt =
    "You are a web developer. Customise a website template for a client. " +
    "Return ONLY a JSON array of {path, content} objects. No markdown fences. " +
    "Preserve template structure. Update text, colours and branding per the brief. " +
    "Use provided image paths in <img> tags: square images for logos/thumbnails, landscape for heroes/banners." +
    (opts.oldSitePages?.length
      ? " IMPORTANT: The client has an existing site being rebuilt. Create equivalent pages for ALL old site pages listed below to preserve SEO. Keep the same URL structure where possible."
      : "");

  // Trim inputs to stay within token limits
  const trimmedTemplates = trimTemplateFiles(opts.templateFiles);
  const existingContent = opts.existingSiteContent
    ? compressSiteContent(opts.existingSiteContent)
    : "";

  let userPrompt = `Client: "${opts.clientName}"

Brief: ${opts.brief}
`;

  if (opts.oldSitePages?.length) {
    userPrompt += `\nOld site pages to recreate (preserve these URL paths):\n${opts.oldSitePages
      .map((p) => {
        try {
          const path = new URL(p.url).pathname;
          return `- ${path} (${p.title})`;
        } catch {
          return `- ${p.url} (${p.title})`;
        }
      })
      .join("\n")}\n`;
  }

  if (existingContent) {
    userPrompt += `\nExisting site content (reference for tone and content):\n${existingContent}\n`;
  }

  if (opts.imagePaths?.length) {
    userPrompt += `\nImages (use these paths in <img src>):\n${opts.imagePaths.map((p) => `- ${p}`).join("\n")}\n`;
  }

  userPrompt += `\nTemplate files:\n${trimmedTemplates.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n")}`;

  const res = await fetch(`${ANTHROPIC_API}/messages`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to generate site files");
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "[]";
  const stopReason = data.stop_reason;

  return parseGeneratedFiles(text, stopReason);
}

/**
 * Parse AI-generated file output with multiple fallback strategies.
 */
function parseGeneratedFiles(
  text: string,
  stopReason?: string,
): { path: string; content: string }[] {
  // Strategy 1: Direct parse
  try {
    const result = JSON.parse(text);
    if (Array.isArray(result)) return result;
  } catch {
    // continue to fallbacks
  }

  // Strategy 2: Strip markdown code fences
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
  try {
    const result = JSON.parse(stripped);
    if (Array.isArray(result)) return result;
  } catch {
    // continue
  }

  // Strategy 3: Extract JSON array from text
  const match = stripped.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) {
    try {
      const result = JSON.parse(match[0]);
      if (Array.isArray(result)) return result;
    } catch {
      // continue
    }
  }

  // Strategy 4: If response was truncated (max_tokens), try to close the JSON
  if (stopReason === "max_tokens" || !stripped.trimEnd().endsWith("]")) {
    // Find the last complete object (ends with }) and close the array
    const lastBrace = stripped.lastIndexOf("}");
    if (lastBrace > 0) {
      const truncated = stripped.slice(0, lastBrace + 1) + "]";
      // Find the start of the array
      const arrayStart = truncated.indexOf("[");
      if (arrayStart >= 0) {
        try {
          const result = JSON.parse(truncated.slice(arrayStart));
          if (Array.isArray(result)) return result;
        } catch {
          // continue
        }
      }
    }
  }

  console.error(
    "Failed to parse AI response. stop_reason:",
    stopReason,
    "First 500 chars:",
    text.slice(0, 500),
  );
  throw new Error(
    "Failed to parse generated files — the AI response could not be parsed as JSON. " +
    (stopReason === "max_tokens"
      ? "The response was truncated due to length. Try a shorter brief or fewer pages."
      : "Try rebuilding."),
  );
}
