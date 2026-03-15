const ANTHROPIC_API = "https://api.anthropic.com/v1";

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

export async function generateSiteFiles(
  apiKey: string,
  opts: {
    templateFiles: { path: string; content: string }[];
    brief: string;
    clientName: string;
    existingSiteContent?: string;
    imagePaths?: string[];
  },
): Promise<{ path: string; content: string }[]> {
  const systemPrompt = `You are a web developer assistant. You take a website template and customize it for a specific client based on their brief. You must return a JSON array of files with path and content fields. Preserve the template's structure but update all content, colors, and branding to match the client. When image paths are provided, use them in the HTML with <img> tags. Place square images where logos, profile photos, or thumbnails fit, and landscape images where hero banners, feature images, or gallery images fit.`;

  const userPrompt = `Customize this website template for "${opts.clientName}".

Brief:
${opts.brief}

${opts.existingSiteContent ? `Existing site content to use as reference:\n${opts.existingSiteContent}\n` : ""}
${opts.imagePaths?.length ? `${opts.imagePaths.map((p) => `- ${p}`).join("\n")}\nUse these exact paths in <img src="..."> tags throughout the site.\n` : ""}
Template files:
${opts.templateFiles.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n")}

Return ONLY a JSON array of objects with "path" and "content" fields. No markdown code blocks, just raw JSON.`;

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
