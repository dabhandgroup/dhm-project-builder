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
      max_tokens: 16384,
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

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse generated files");
  }
}
