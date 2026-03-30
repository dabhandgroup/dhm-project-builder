import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries/settings";
import { createRepo, pushFiles } from "@/lib/github";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, projectTitle, domainName } = await req.json();
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  // Load GitHub settings
  const settings = await getSettings([
    "github_pat",
    "github_org",
    "github_default_branch",
  ]);
  const githubPat = settings.github_pat;
  const githubOrg = settings.github_org || "dabhandgroup";
  const branch = settings.github_default_branch || "main";

  if (!githubPat) {
    return NextResponse.json(
      { error: "GitHub not configured. Go to Settings." },
      { status: 400 },
    );
  }

  // Load crawl data from storage
  const { data: crawlBlob, error: loadError } = await supabase.storage
    .from("project-assets")
    .download(`crawl-data/${projectId}.json`);

  if (loadError || !crawlBlob) {
    return NextResponse.json(
      { error: "No crawl data found. Run a site scan first." },
      { status: 404 },
    );
  }

  const crawlData = JSON.parse(await crawlBlob.text());

  try {
    // Build a repo name from domain or project title
    const slug = (domainName || projectTitle || projectId)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const repoName = `${slug}-crawl`;

    // Create repo (or use existing)
    let repo;
    try {
      repo = await createRepo(githubPat, githubOrg, repoName);
    } catch {
      // Repo may already exist — try to push to it directly
      repo = { full_name: `${githubOrg}/${repoName}` };
    }

    const owner = repo.full_name?.split("/")[0] || githubOrg;
    const name = repo.full_name?.split("/")[1] || repoName;

    // Build files for the repo
    const files: { path: string; content: string; encoding?: "utf-8" | "base64" }[] = [];

    // README
    const readmeLines = [
      `# Site Crawl: ${domainName || projectTitle || projectId}`,
      "",
      `Crawled at: ${crawlData.crawledAt || new Date().toISOString()}`,
      `Pages: ${crawlData.pages?.length || 0}`,
      `URLs discovered: ${crawlData.allUrls?.length || 0}`,
      "",
      "## Pages",
      "",
    ];
    for (const page of crawlData.pages || []) {
      readmeLines.push(
        `- [${page.metadata?.title || page.url}](${page.url})`,
      );
    }
    files.push({ path: "README.md", content: readmeLines.join("\n") });

    // Sitemap / URL list
    if (crawlData.allUrls?.length) {
      files.push({
        path: "sitemap-urls.txt",
        content: crawlData.allUrls.join("\n"),
      });
    }

    // Individual page files (markdown + HTML)
    for (const page of crawlData.pages || []) {
      let urlPath: string;
      try {
        urlPath =
          new URL(page.url).pathname.replace(/^\//, "") || "index";
      } catch {
        urlPath = "index";
      }
      urlPath = urlPath.replace(/\/$/, "") || "index";

      if (page.markdown) {
        files.push({
          path: `pages/${urlPath}/content.md`,
          content: page.markdown,
        });
      }
      if (page.html) {
        files.push({
          path: `pages/${urlPath}/index.html`,
          content: page.html,
        });
      }
    }

    // Push all files
    await pushFiles(
      githubPat,
      owner,
      name,
      files,
      `Crawl data from ${domainName || "site"} — ${new Date().toISOString()}`,
      branch,
    );

    const repoUrl = `https://github.com/${owner}/${name}`;

    return NextResponse.json({ success: true, repoUrl, repoName: `${owner}/${name}` });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to push to GitHub";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
