import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectById } from "@/lib/queries/projects";
import { getTemplateById } from "@/lib/queries/templates";
import { getAllSettings } from "@/lib/queries/settings";
import { createRepo, pushFiles } from "@/lib/github";
import { crawlSite, generateRedirects, generateRedirectsCsv } from "@/lib/firecrawl";
import { generateSiteFiles } from "@/lib/anthropic";
import { createVercelProject, linkRepoToProject } from "@/lib/vercel";
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
    // Load project
    setStatus(projectId, { step: "pending", message: "Loading project data..." });
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

    // Load project images for inclusion in the repo
    const projectImages = await loadProjectImages(projectId);
    const imagePaths = projectImages.map((img) => img.path);

    // Step 1: Load crawl data or scrape existing site (if rebuild)
    let existingSiteContent = "";
    let discoveredUrls: string[] = [];
    let oldSiteFiles: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [];

    if (project.is_rebuild && project.domain_name) {
      setStatus(projectId, { step: "scraping", message: "Loading site data..." });

      // Try loading pre-crawled data from storage first
      const storedCrawl = await loadCrawlData(projectId);

      if (storedCrawl && storedCrawl.pages.length > 0) {
        existingSiteContent = storedCrawl.pages
          .map((p) => `## ${p.url}\n${p.markdown}`)
          .join("\n\n");
        discoveredUrls = storedCrawl.allUrls;
      } else if (firecrawlKey) {
        // Fallback: live crawl
        setStatus(projectId, { step: "scraping", message: "Scraping existing site..." });
        try {
          const result = await crawlSite(firecrawlKey, `https://${project.domain_name}`, 20);
          existingSiteContent = result.pages.map((p) => `## ${p.url}\n${p.markdown}`).join("\n\n");
          discoveredUrls = result.pages.map((p) => p.url);
        } catch {
          existingSiteContent = "";
        }
      }

      // Load the crawled site ZIP for inclusion in the repo
      oldSiteFiles = await loadSiteZipFiles(projectId);
    }

    // Step 2: Generate site files with AI
    setStatus(projectId, { step: "generating", message: "Building site..." });

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

    const generatedFiles = await generateSiteFiles(anthropicKey, {
      templateFiles,
      brief: project.brief || project.title,
      clientName: client?.name || project.title,
      existingSiteContent: existingSiteContent || undefined,
      imagePaths: imagePaths.length > 0 ? imagePaths : undefined,
      oldSitePages,
    });

    // Step 3: Create GitHub repo and push files
    setStatus(projectId, { step: "pushing", message: "Pushing to GitHub..." });

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

    // Combine generated text files, redirects, binary image files, and old site files
    const allFiles = [
      ...generatedFiles.map((f) => ({ path: f.path, content: f.content, encoding: "utf-8" as const })),
      ...redirectFiles,
      ...projectImages.map((img) => ({ path: img.path, content: img.base64, encoding: "base64" as const })),
      ...oldSiteFiles,
    ];

    // Create a ZIP of all generated files for manual download
    try {
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
    } catch {
      // Non-fatal — zip download is a convenience feature
    }

    await pushFiles(githubPat, githubOrg, repoName, allFiles, "Initial site generated by DHM Project Builder");

    // Step 4: Deploy
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
      // Default: Vercel
      const vercelProject = await createVercelProject(repoName);
      await linkRepoToProject(vercelProject.id, repoFullName);
      previewUrl = `https://${repoName}.vercel.app`;
      vercelProjectId = vercelProject.id;
    }

    // Update project in database (preserve current status)
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
      message: "Pipeline complete!",
      preview_url: previewUrl,
      github_repo_url: githubRepoUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    setStatus(projectId, { step: "failed", message, error: message });

    // Update project status to failed
    await supabase
      .from("projects")
      .update({ status: "in_progress" })
      .eq("id", projectId);
  }
}
