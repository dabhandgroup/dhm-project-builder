import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectById } from "@/lib/queries/projects";
import { getTemplateById } from "@/lib/queries/templates";
import { getAllSettings } from "@/lib/queries/settings";
import { createRepo, pushFiles } from "@/lib/github";
import { crawlSite } from "@/lib/firecrawl";
import { generateSiteFiles } from "@/lib/anthropic";
import { createVercelProject, linkRepoToProject } from "@/lib/vercel";
import { createSite, linkRepoToSite } from "@/lib/netlify";
import { loadTemplateFiles } from "@/lib/template-loader";
import { loadProjectImages, getImageManifest } from "@/lib/image-loader";

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
}

// In-memory status store (for simplicity — could be Redis/DB in production)
const statusMap = new Map<string, PipelineStatus>();

export function getPipelineStatus(projectId: string): PipelineStatus | null {
  return statusMap.get(projectId) ?? null;
}

function setStatus(projectId: string, status: PipelineStatus) {
  statusMap.set(projectId, status);
}

export async function runPipeline(projectId: string) {
  const supabase = createAdminClient();

  try {
    // Load project
    setStatus(projectId, { step: "pending", message: "Loading project data..." });
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

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

    // Step 1: Scrape existing site (if rebuild)
    let existingSiteContent = "";
    if (project.is_rebuild && project.domain_name && firecrawlKey) {
      setStatus(projectId, { step: "scraping", message: "Scraping existing site..." });
      try {
        const result = await crawlSite(firecrawlKey, `https://${project.domain_name}`, 5);
        existingSiteContent = result.pages.map((p) => `## ${p.url}\n${p.markdown}`).join("\n\n");
      } catch {
        // Scraping is optional — continue without it
        existingSiteContent = "";
      }
    }

    // Step 2: Generate site files with AI
    setStatus(projectId, { step: "generating", message: "Generating site with AI..." });

    const client = (project as Record<string, unknown>).clients as { name: string } | null;
    const generatedFiles = await generateSiteFiles(anthropicKey, {
      templateFiles,
      brief: project.brief || project.title,
      clientName: client?.name || project.title,
      existingSiteContent: existingSiteContent || undefined,
      imagePaths: imagePaths.length > 0 ? imagePaths : undefined,
    });

    // Step 3: Create GitHub repo and push files
    setStatus(projectId, { step: "pushing", message: "Creating GitHub repo and pushing files..." });

    const repoName = project.domain_name
      ? project.domain_name.replace(/\./g, "-")
      : project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const repo = await createRepo(githubPat, githubOrg, repoName);
    const repoFullName = repo.full_name;
    const githubRepoUrl = repo.html_url;

    // Wait briefly for repo to be ready
    await new Promise((r) => setTimeout(r, 2000));

    // Combine generated text files with binary image files
    const allFiles = [
      ...generatedFiles.map((f) => ({ path: f.path, content: f.content, encoding: "utf-8" as const })),
      ...projectImages.map((img) => ({ path: img.path, content: img.base64, encoding: "base64" as const })),
    ];

    await pushFiles(githubPat, githubOrg, repoName, allFiles, "Initial site generated by DHM Project Builder");

    // Step 4: Deploy
    setStatus(projectId, { step: "deploying", message: `Deploying to ${deployProvider}...` });

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

    // Update project in database
    await supabase
      .from("projects")
      .update({
        preview_url: previewUrl,
        github_repo_url: githubRepoUrl,
        vercel_project_id: vercelProjectId,
        status: "initial_draft" as const,
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
