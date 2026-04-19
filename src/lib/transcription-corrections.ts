// Static corrections for common speech-recognition mishearings of tech terms
const CORRECTIONS: [RegExp, string][] = [
  [/\bx\s*js\b/gi, "Next.js"],
  [/\bnext\s+j\s+s\b/gi, "Next.js"],
  [/\bxjs\b/gi, "Next.js"],
  [/\breact\s+native\b/gi, "React Native"],
  [/\bsuper\s*base\b/gi, "Supabase"],
  [/\bsuper\s*bass\b/gi, "Supabase"],
  [/\bconvict\b/gi, "Convex"],
  [/\btail\s*wind\b/gi, "Tailwind"],
  [/\btailwind\s*css\b/gi, "Tailwind CSS"],
  [/\btype\s*script\b/gi, "TypeScript"],
  [/\btype\s*safe\b/gi, "type-safe"],
  [/\bfire\s*base\b/gi, "Firebase"],
  [/\bfire\s*crawl\b/gi, "Firecrawl"],
  [/\bword\s*press\b/gi, "WordPress"],
  [/\bgit\s*hub\b/gi, "GitHub"],
  [/\bnet\s*lify\b/gi, "Netlify"],
  [/\bverse\s*el\b/gi, "Vercel"],
  [/\bver\s*sell\b/gi, "Vercel"],
  [/\bpostgres\b/gi, "PostgreSQL"],
  [/\bpostgresql\b/gi, "PostgreSQL"],
  [/\bjai\s*son\b/gi, "JSON"],
  [/\brest\s*api\b/gi, "REST API"],
  [/\bapis?\b/gi, (m) => m.toUpperCase()],
];

// Cache for our-work project list — module-level, lives for the process lifetime
let projectCache: { name: string; url: string }[] | null = null;
let projectCacheAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchProjects(): Promise<{ name: string; url: string }[]> {
  if (projectCache && Date.now() - projectCacheAt < CACHE_TTL) return projectCache;

  try {
    const res = await fetch("https://dabhandmarketing.com/our-work", {
      headers: { "User-Agent": "DHM-Builder/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return projectCache ?? [];
    const html = await res.text();

    // Extract project names from common patterns: headings, link text, data attributes
    const matches: { name: string; url: string }[] = [];

    // Match heading tags with content
    const headingRegex = /<h[1-6][^>]*>([^<]{3,60})<\/h[1-6]>/gi;
    let m: RegExpExecArray | null;
    while ((m = headingRegex.exec(html)) !== null) {
      const name = m[1].trim();
      if (name.length > 2) matches.push({ name, url: "https://dabhandmarketing.com/our-work" });
    }

    // Deduplicate by name
    const seen = new Set<string>();
    const unique = matches.filter((p) => {
      const key = p.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    projectCache = unique;
    projectCacheAt = Date.now();
    return unique;
  } catch {
    return projectCache ?? [];
  }
}

export async function applyCorrections(text: string): Promise<string> {
  let result = text;

  // Apply static tech-term corrections
  for (const [pattern, replacement] of CORRECTIONS) {
    if (typeof replacement === "string") {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }

  // Apply project name corrections (append URL if mentioned)
  try {
    const projects = await fetchProjects();
    for (const project of projects) {
      const escaped = project.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      if (regex.test(result)) {
        // Only append URL if not already present
        if (!result.includes(project.url)) {
          result = result.replace(regex, `${project.name} (${project.url})`);
        }
      }
    }
  } catch {
    // Non-critical — proceed without project corrections
  }

  return result;
}
