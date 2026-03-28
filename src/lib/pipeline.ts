import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectById } from "@/lib/queries/projects";
import { getTemplateById } from "@/lib/queries/templates";
import { getAllSettings } from "@/lib/queries/settings";
import { createRepo, pushFiles } from "@/lib/github";
import { crawlSite, generateRedirects, generateRedirectsCsv } from "@/lib/firecrawl";
import { generateSiteFiles } from "@/lib/anthropic";
import { createVercelProject, linkRepoToProject, addCustomDomain } from "@/lib/vercel";
import { createSite, linkRepoToSite } from "@/lib/netlify";
import { loadTemplateFiles } from "@/lib/template-loader";
import { loadProjectImages, getImageManifest } from "@/lib/image-loader";
import JSZip from "jszip";
import type { CrawlPage } from "@/lib/firecrawl";

export type PipelineStep =
  | "pending"
  | "scraping"
  | "generating"
  | "pushing"
  | "deploying"
  | "complete"
  | "failed";

export interface PipelineStatus {
  step: PipelineStep;
  message: string;
  error?: string;
  preview_url?: string;
  github_repo_url?: string;
  deploy_provider?: string;
  has_build_zip?: boolean;
  completed_substeps?: string[];
}

// In-memory status store (for simplicity — could be Redis/DB in production)
const statusMap = new Map<string, PipelineStatus>();

export function getPipelineStatus(projectId: string): PipelineStatus | null {
  return statusMap.get(projectId) ?? null;
}

function setStatus(projectId: string, status: PipelineStatus) {
  statusMap.set(projectId, status);
}

// Load stored crawl data from Supabase storage (if exists)
async function loadCrawlData(projectId: string): Promise<{
  pages: CrawlPage[];
  allUrls: string[];
  domain: string;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("project-assets")
    .download(`crawl-data/${projectId}.json`);

  if (error || !data) return null;

  try {
    const text = await data.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Save crawl data to Supabase storage (reusable by pipeline after live crawl)
async function saveCrawlDataToStorage(
  projectId: string,
  domain: string,
  pages: { url: string; markdown: string; html?: string; rawHtml?: string; links?: string[]; metadata?: Record<string, unknown>; screenshot?: string | null }[],
  allUrls: string[],
) {
  const supabase = createAdminClient();

  // Save main crawl JSON
  const crawlJson = JSON.stringify({
    domain,
    allUrls,
    crawledAt: new Date().toISOString(),
    pages: pages.map((p) => ({
      url: p.url,
      markdown: p.markdown,
      html: p.html || p.rawHtml || "",
      links: p.links || [],
      metadata: p.metadata || {},
      hasScreenshot: !!p.screenshot,
    })),
  });

  await supabase.storage
    .from("project-assets")
    .upload(`crawl-data/${projectId}.json`, crawlJson, {
      contentType: "application/json",
      upsert: true,
    });

  // Save site ZIP with markdown content
  const zip = new JSZip();
  for (const page of pages) {
    let urlPath: string;
    try {
      urlPath = new URL(page.url).pathname.replace(/^\//, "") || "index";
    } catch {
      urlPath = "index";
    }
    urlPath = urlPath.replace(/\/$/, "");
    const htmlContent = page.rawHtml || page.html;
    if (htmlContent) zip.file(`${urlPath}/index.html`, htmlContent);
    if (page.markdown) zip.file(`${urlPath}/index.md`, page.markdown);
  }
  const zipBlob = await zip.generateAsync({ type: "nodebuffer" });
  await supabase.storage
    .from("project-assets")
    .upload(`crawl-data/${projectId}-site.zip`, zipBlob, {
      contentType: "application/zip",
      upsert: true,
    });
}

// Load stored site ZIP and extract files for inclusion in the repo
async function loadSiteZipFiles(projectId: string): Promise<{ path: string; content: string; encoding: "utf-8" | "base64" }[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("project-assets")
    .download(`crawl-data/${projectId}-site.zip`);

  if (error || !data) return [];

  try {
    const buffer = await data.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const files: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [];

    const TEXT_EXT = new Set([".html", ".htm", ".md", ".txt", ".css", ".js", ".json", ".xml", ".svg"]);

    for (const [relativePath, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;

      const ext = relativePath.substring(relativePath.lastIndexOf(".")).toLowerCase();
      if (TEXT_EXT.has(ext)) {
        const content = await entry.async("string");
        files.push({ path: `_old-site/${relativePath}`, content, encoding: "utf-8" });
      } else {
        const content = await entry.async("base64");
        files.push({ path: `_old-site/${relativePath}`, content, encoding: "base64" });
      }
    }

    return files;
  } catch {
    return [];
  }
}

export async function runPipeline(projectId: string) {
  const supabase = createAdminClient();

  try {
    // Track completed substeps for live checklist
    const substeps: string[] = [];

    // Load project
    setStatus(projectId, { step: "pending", message: "Loading project data...", completed_substeps: substeps });
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    // Auto-advance status to initial_draft when build starts
    if (project.status === "lead") {
      await supabase.from("projects").update({ status: "initial_draft" }).eq("id", projectId);
    }

    // Load settings
    const settings = await getAllSettings();
    const githubPat = settings.github_pat;
    const githubOrg = settings.github_org || "dabhandgroup";
    const anthropicKey = settings.anthropic_api_key;
    const firecrawlKey = settings.firecrawl_api_key;
    const deployProvider = project.deploy_provider || "vercel";

    if (!githubPat) throw new Error("GitHub PAT not configured. Go to Settings.");
    if (!anthropicKey) throw new Error("Anthropic API key not configured. Go to Settings.");

    // Load template files from ZIP in Supabase Storage
    let templateFiles: { path: string; content: string }[] = [];
    if (project.template_id) {
      const template = await getTemplateById(project.template_id);
      if (template?.storage_path) {
        try {
          templateFiles = await loadTemplateFiles(template.storage_path);
        } catch (err) {
          console.error("Failed to load template ZIP:", err);
        }
      }
    }

    if (templateFiles.length === 0) {
      templateFiles = [
        {
          path: "index.html",
          content: `<!DOCTYPE html>\n<html><head><title>${project.title}</title></head><body><h1>${project.title}</h1></body></html>`,
        },
      ];
    }

    substeps.push("template");
    setStatus(projectId, { step: "pending", message: "Loading project images...", completed_substeps: [...substeps] });

    // Load project images for inclusion in the repo
    const projectImages = await loadProjectImages(projectId);
    const imagePaths = projectImages.map((img) => img.path);

    substeps.push("images");
    setStatus(projectId, { step: "pending", message: "Project data loaded", completed_substeps: [...substeps] });

    // Step 1: Load crawl data or scrape existing site (if rebuild)
    let existingSiteContent = "";
    let discoveredUrls: string[] = [];
    let oldSiteFiles: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [];

    if (project.is_rebuild && project.domain_name) {
      setStatus(projectId, { step: "scraping", message: "Checking for saved crawl data...", completed_substeps: [...substeps] });

      // Try loading pre-crawled data from storage first
      const storedCrawl = await loadCrawlData(projectId);

      if (storedCrawl && storedCrawl.pages.length > 0) {
        substeps.push("scrape");
        setStatus(projectId, { step: "scraping", message: `Using saved crawl data (${storedCrawl.pages.length} pages)`, completed_substeps: [...substeps] });
        existingSiteContent = storedCrawl.pages
          .map((p) => `## ${p.url}\n${p.markdown}`)
          .join("\n\n");
        discoveredUrls = storedCrawl.allUrls;
      } else if (firecrawlKey) {
        // Fallback: live crawl
        setStatus(projectId, { step: "scraping", message: "No saved data — scraping existing site...", completed_substeps: [...substeps] });
        try {
          const result = await crawlSite(firecrawlKey, `https://${project.domain_name}`, 20);
          existingSiteContent = result.pages.map((p) => `## ${p.url}\n${p.markdown}`).join("\n\n");
          discoveredUrls = result.pages.map((p) => p.url);

          // Save crawl data so future builds don't re-scrape
          try {
            await saveCrawlDataToStorage(projectId, project.domain_name, result.pages, discoveredUrls);
          } catch (saveErr) {
            console.error("Failed to save crawl data:", saveErr);
          }
        } catch {
          existingSiteContent = "";
        }
      }

      // Load the crawled site ZIP for inclusion in the repo
      oldSiteFiles = await loadSiteZipFiles(projectId);
      if (!substeps.includes("scrape")) substeps.push("scrape");
    }

    // Step 2: Generate site files with AI
    setStatus(projectId, { step: "generating", message: "Generating pages with AI...", completed_substeps: [...substeps] });

    const client = (project as Record<string, unknown>).clients as { name: string } | null;

    // Build old site page list for AI to recreate
    let oldSitePages: { url: string; title: string }[] | undefined;
    if (project.is_rebuild) {
      const storedCrawl = await loadCrawlData(projectId);
      if (storedCrawl?.pages.length) {
        oldSitePages = storedCrawl.pages.map((p) => ({
          url: p.url,
          title: (p.metadata as Record<string, string>)?.title || p.url,
        }));
      }
    }

    const generateOpts = {
      templateFiles,
      brief: project.brief || project.title,
      clientName: client?.name || project.title,
      existingSiteContent: existingSiteContent || undefined,
      imagePaths: imagePaths.length > 0 ? imagePaths : undefined,
      oldSitePages,
    };

    let generatedFiles: { path: string; content: string }[];
    try {
      generatedFiles = await generateSiteFiles(anthropicKey, generateOpts);
    } catch (err) {
      // Retry once on failure
      setStatus(projectId, { step: "generating", message: "Retrying site generation...", completed_substeps: [...substeps] });
      try {
        generatedFiles = await generateSiteFiles(anthropicKey, generateOpts);
      } catch (retryErr) {
        throw new Error(`AI generation failed: ${retryErr instanceof Error ? retryErr.message : "Unknown error"}`);
      }
    }

    if (!generatedFiles.length) {
      throw new Error("AI generated no files. Try simplifying the brief or reducing pages.");
    }

    substeps.push("generate");

    // Step 3: Create GitHub repo and push files
    setStatus(projectId, { step: "pushing", message: "Creating redirects...", completed_substeps: [...substeps] });

    const repoName = project.domain_name
      ? project.domain_name.replace(/\./g, "-")
      : project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const repo = await createRepo(githubPat, githubOrg, repoName);
    const repoFullName = repo.full_name;
    const githubRepoUrl = repo.html_url;

    // Wait briefly for repo to be ready
    await new Promise((r) => setTimeout(r, 2000));

    // Generate redirects file from discovered URLs, matching to new pages where possible
    const newPagePaths = generatedFiles.map((f) => `/${f.path}`);
    const redirectFiles: { path: string; content: string; encoding: "utf-8" }[] = [];
    if (discoveredUrls.length > 0 && project.domain_name) {
      if (deployProvider === "netlify") {
        const redirectsContent = generateRedirects(discoveredUrls, project.domain_name, "netlify", newPagePaths);
        redirectFiles.push({
          path: "_redirects",
          content: redirectsContent as string,
          encoding: "utf-8",
        });
      } else {
        const redirectsConfig = generateRedirects(discoveredUrls, project.domain_name, "vercel", newPagePaths);
        redirectFiles.push({
          path: "vercel.json",
          content: JSON.stringify(redirectsConfig, null, 2),
          encoding: "utf-8",
        });
      }

      // Generate CSV redirect map for SEO tracking
      const csv = generateRedirectsCsv(discoveredUrls, project.domain_name, newPagePaths);
      redirectFiles.push({
        path: "_redirects-map.csv",
        content: csv,
        encoding: "utf-8",
      });

      // Store CSV in Supabase for later download
      try {
        await supabase.storage
          .from("project-assets")
          .upload(`crawl-data/${projectId}-redirects.csv`, csv, {
            contentType: "text/csv",
            upsert: true,
          });
      } catch {
        // Non-fatal
      }
    }

    substeps.push("redirects");
    setStatus(projectId, { step: "pushing", message: "Packaging ZIP...", completed_substeps: [...substeps] });

    // Combine generated text files, redirects, binary image files, and old site files
    const allFiles = [
      ...generatedFiles.map((f) => ({ path: f.path, content: f.content, encoding: "utf-8" as const })),
      ...redirectFiles,
      ...projectImages.map((img) => ({ path: img.path, content: img.base64, encoding: "base64" as const })),
      ...oldSiteFiles,
    ];

    // Create a ZIP of all generated files for download and preview
    const zip = new JSZip();
    for (const file of allFiles) {
      if (file.encoding === "base64") {
        zip.file(file.path, file.content, { base64: true });
      } else {
        zip.file(file.path, file.content);
      }
    }
    const zipBlob = await zip.generateAsync({ type: "nodebuffer" });
    await supabase.storage
      .from("project-assets")
      .upload(`builds/${projectId}.zip`, zipBlob, {
        contentType: "application/zip",
        upsert: true,
      });

    substeps.push("zip");
    setStatus(projectId, { step: "pushing", message: "Pushing to GitHub...", completed_substeps: [...substeps] });

    // Push files to GitHub
    try {
      await pushFiles(githubPat, githubOrg, repoName, allFiles);
      substeps.push("push");
    } catch (pushErr) {
      console.error("GitHub push failed:", pushErr);
      // Non-fatal — build ZIP already saved, user can still download
    }

    // Pipeline complete — site is ready for preview and download
    setStatus(projectId, {
      step: "complete",
      message: "Site generated! Preview it below or download the ZIP.",
      has_build_zip: true,
      completed_substeps: [...substeps],
    });
  } catch (err) {
    let message = err instanceof Error ? err.message : "Pipeline failed";

    // Provide actionable guidance for common GitHub errors
    if (message.includes("Resource not accessible by personal access token")) {
      message = "GitHub PAT doesn't have permission to push. Check that your token has 'repo' scope and access to the organisation. Go to Settings to update it.";
    }

    // Check if a build ZIP was saved before the failure
    let hasBuildZip = false;
    try {
      const { data: zipCheck } = await supabase.storage
        .from("project-assets")
        .list("builds", { search: projectId });
      hasBuildZip = (zipCheck?.length ?? 0) > 0;
    } catch {
      // ignore
    }

    setStatus(projectId, { step: "failed", message, error: message, has_build_zip: hasBuildZip });
  }
}

/**
 * Optional: Deploy a built project to GitHub + Vercel/Netlify.
 * Called separately after the main pipeline completes.
 */
export async function deployProject(projectId: string) {
  const supabase = createAdminClient();

  try {
    setStatus(projectId, { step: "pushing", message: "Pushing to GitHub..." });

    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    const settings = await getAllSettings();
    const githubPat = settings.github_pat;
    const githubOrg = settings.github_org || "dabhandgroup";
    const deployProvider = project.deploy_provider || "vercel";

    if (!githubPat) throw new Error("GitHub PAT not configured. Go to Settings.");

    // Download built ZIP from storage
    const { data: zipData, error: zipError } = await supabase.storage
      .from("project-assets")
      .download(`builds/${projectId}.zip`);

    if (zipError || !zipData) throw new Error("No build found. Run the pipeline first.");

    const zip = await JSZip.loadAsync(await zipData.arrayBuffer());
    const allFiles: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [];

    for (const [path, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      // Detect binary files
      const isBinary = /\.(png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|svg)$/i.test(path);
      if (isBinary) {
        const base64 = await file.async("base64");
        allFiles.push({ path, content: base64, encoding: "base64" });
      } else {
        const content = await file.async("string");
        allFiles.push({ path, content, encoding: "utf-8" });
      }
    }

    const repoName = project.domain_name
      ? project.domain_name.replace(/\./g, "-")
      : project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const repo = await createRepo(githubPat, githubOrg, repoName);
    const repoFullName = repo.full_name;
    const githubRepoUrl = repo.html_url;

    await new Promise((r) => setTimeout(r, 2000));
    await pushFiles(githubPat, githubOrg, repoName, allFiles, "Initial site generated by DHM Project Builder");

    // Deploy
    setStatus(projectId, { step: "deploying", message: `Deploying to ${deployProvider}...`, deploy_provider: deployProvider });

    let previewUrl = "";
    let vercelProjectId: string | null = null;

    if (deployProvider === "netlify") {
      const netlifyToken = settings.netlify_token;
      if (netlifyToken) {
        const site = await createSite(netlifyToken, repoName);
        await linkRepoToSite(netlifyToken, site.id, repoFullName);
        previewUrl = site.ssl_url || site.url || `https://${repoName}.netlify.app`;
      }
    } else {
      const vercelProject = await createVercelProject(repoName);
      await linkRepoToProject(vercelProject.id, repoFullName);
      vercelProjectId = vercelProject.id;

      // Add custom subdomain (projectname.dabhandmarketing-demos.com)
      const customDomain = `${repoName}.dabhandmarketing-demos.com`;
      try {
        await addCustomDomain(vercelProject.id, customDomain);
        previewUrl = `https://${customDomain}`;
      } catch {
        // Fall back to default Vercel URL if custom domain fails
        previewUrl = `https://${repoName}.vercel.app`;
      }
    }

    await supabase
      .from("projects")
      .update({
        preview_url: previewUrl,
        github_repo_url: githubRepoUrl,
        vercel_project_id: vercelProjectId,
      })
      .eq("id", projectId);

    setStatus(projectId, {
      step: "complete",
      message: "Deployed successfully!",
      preview_url: previewUrl,
      github_repo_url: githubRepoUrl,
      has_build_zip: true,
    });
  } catch (err) {
    let message = err instanceof Error ? err.message : "Deploy failed";
    if (message.includes("Resource not accessible by personal access token")) {
      message = "GitHub PAT doesn't have permission. Check token has 'repo' scope and org access in Settings.";
    }
    setStatus(projectId, { step: "failed", message, error: message, has_build_zip: true });
  }
}
