"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import {
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  Globe,
  Cpu,
  Search,
  Rocket,
  Download,
  FileText,
  Code,
  Camera,
  Link2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileSpreadsheet,
  Package,
  Shield,
  Image as ImageIcon,
  Github,
} from "lucide-react";
import { SitePreview } from "@/components/projects/site-preview";

interface SubstepDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const buildSubsteps: SubstepDef[] = [
  { key: "template", icon: <Code className="h-3.5 w-3.5" />, label: "Loading template files" },
  { key: "images", icon: <ImageIcon className="h-3.5 w-3.5" />, label: "Loading project images" },
  { key: "scrape", icon: <Search className="h-3.5 w-3.5" />, label: "Loading site data" },
  { key: "generate", icon: <Cpu className="h-3.5 w-3.5" />, label: "Generating pages with AI" },
  { key: "redirects", icon: <Shield className="h-3.5 w-3.5" />, label: "Creating 301 redirects" },
  { key: "zip", icon: <Package className="h-3.5 w-3.5" />, label: "Packaging downloadable ZIP" },
  { key: "push", icon: <Github className="h-3.5 w-3.5" />, label: "Pushing to GitHub" },
];

type StepStatus = "pending" | "scraping" | "generating" | "pushing" | "complete" | "failed" | "idle";

interface CrawlPage {
  url: string;
  markdown: string;
  html: string;
  rawHtml: string;
  screenshot: string | null;
  links: string[];
  metadata: { title?: string; description?: string; [key: string]: unknown };
}

interface CrawlDataResponse {
  pages: CrawlPage[];
  allUrls: string[];
  domain: string;
  crawledAt?: string;
}

function getSubstepState(
  substepKey: string,
  completedSubsteps: string[],
  isRunning: boolean,
  isComplete: boolean,
): "done" | "active" | "pending" {
  if (completedSubsteps.includes(substepKey)) return "done";
  if (isComplete) return "done";
  // The next uncompleted substep is active if pipeline is still running
  if (isRunning) {
    const allKeys = buildSubsteps.map((s) => s.key);
    const nextKey = allKeys.find((k) => !completedSubsteps.includes(k));
    if (nextKey === substepKey) return "active";
  }
  return "pending";
}

export function PipelineStatus({ projectId, isRebuild }: { projectId: string; isRebuild?: boolean }) {
  const [status, setStatus] = useState<{
    step: StepStatus;
    message: string;
    error?: string;
    has_build_zip?: boolean;
    completed_substeps?: string[];
  }>({ step: "idle", message: "" });
  const [starting, setStarting] = useState(false);
  // Prevents polling from resetting status to "idle" right after we click Build
  const justStartedRef = useRef(false);
  const [crawlData, setCrawlData] = useState<CrawlDataResponse | null>(null);
  const [crawlExpanded, setCrawlExpanded] = useState(false);
  const [pagesExpanded, setPagesExpanded] = useState(true);

  const previewUrl = `/preview/${projectId}`;

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        // Don't let "idle" overwrite local state when we just started the pipeline
        if (data.step === "idle" && justStartedRef.current) {
          return "pending"; // Keep showing progress
        }
        if (data.step !== "idle") {
          justStartedRef.current = false; // Server has caught up
        }
        setStatus(data);
        return data.step;
      }
    } catch {
      // Ignore polling errors
    }
    return justStartedRef.current ? "pending" : "idle";
  }, [projectId]);

  // Load crawl data for display
  const loadCrawlData = useCallback(async () => {
    try {
      const res = await fetch(`/api/crawl/load?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.crawlData) {
          setCrawlData(data.crawlData);
        }
      }
    } catch {
      // Non-fatal
    }
  }, [projectId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      const step = await pollStatus();
      if (cancelled) return;
      // Keep polling if pipeline is running OR if we just started (waiting for server to catch up)
      if (step && !["idle", "complete", "failed"].includes(step)) {
        timer = setTimeout(poll, 2000);
      }
      // Load crawl data when scraping completes or pipeline is done
      if (step === "generating" || step === "complete") {
        loadCrawlData();
      }
    }

    poll();
    // Also try loading crawl data on mount (might already exist from a previous build)
    loadCrawlData();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pollStatus, loadCrawlData]);

  async function startPipeline() {
    setStarting(true);
    justStartedRef.current = true;
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({ step: "failed", message: data.error || "Failed to start pipeline" });
        setStarting(false);
        justStartedRef.current = false;
        return;
      }

      setStatus({ step: "pending", message: "Starting pipeline..." });
      setStarting(false);

      const poll = async () => {
        const step = await pollStatus();
        if (step && !["complete", "failed"].includes(step)) {
          setTimeout(poll, 2000);
        }
        if (step === "generating" || step === "complete") {
          loadCrawlData();
        }
      };
      setTimeout(poll, 1000);
    } catch {
      setStatus({ step: "failed", message: "Failed to start pipeline" });
      setStarting(false);
      justStartedRef.current = false;
    }
  }

  const isRunning = !["idle", "complete", "failed"].includes(status.step);
  const isComplete = status.step === "complete";
  const isFailed = status.step === "failed";
  const hasBuild = status.has_build_zip;

  const pageStats = crawlData
    ? {
        withMarkdown: crawlData.pages.filter((p) => p.markdown).length,
        withHtml: crawlData.pages.filter((p) => p.html || p.rawHtml).length,
        withScreenshots: crawlData.pages.filter((p) => p.screenshot).length,
        totalLinks: new Set(crawlData.pages.flatMap((p) => p.links)).size,
      }
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Site Generation
            </CardTitle>
            {!isRunning && (
              <Button size="sm" onClick={startPipeline} disabled={starting}>
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isComplete || hasBuild ? "Re-build" : "Build Site"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.step !== "idle" && (
            <>
              {/* Live build checklist */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Build Progress</p>
                <div className="grid gap-1.5">
                  {buildSubsteps.map((substep) => {
                    const state = getSubstepState(
                      substep.key,
                      status.completed_substeps ?? [],
                      isRunning,
                      isComplete,
                    );
                    return (
                      <div key={substep.key} className="flex items-center gap-2.5 text-xs">
                        <div className="shrink-0">
                          {state === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {state === "active" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                          {state === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                        </div>
                        <span className={state === "done" ? "text-foreground" : state === "active" ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {substep.icon}
                        </span>
                        <span className={state === "done" ? "text-foreground" : state === "active" ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {substep.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status message */}
              <p className="text-xs text-muted-foreground">{status.message}</p>

              {/* Error */}
              {isFailed && status.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-3 space-y-2">
                  <p className="text-sm text-red-600">{status.error}</p>
                  {hasBuild && (
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground mb-1.5">The site was generated. You can still download it:</p>
                      <a
                        href={`/api/projects/download?projectId=${projectId}&type=build`}
                        download
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download built site ZIP
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Complete — preview link + downloads */}
              {isComplete && (
                <div className="space-y-3">
                  {/* Shareable preview link */}
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex-1"
                    >
                      {typeof window !== "undefined" ? `${window.location.origin}${previewUrl}` : previewUrl}
                    </a>
                    <CopyButton
                      text={typeof window !== "undefined" ? `${window.location.origin}${previewUrl}` : previewUrl}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with your client to preview the site
                  </p>

                  {/* Download links */}
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/projects/download?projectId=${projectId}&type=build`}
                      download
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-900"
                    >
                      <Download className="h-4 w-4" />
                      Download Built Site ZIP
                    </a>
                    <a
                      href={`/api/projects/download?projectId=${projectId}&type=crawl`}
                      download
                      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                    >
                      <Download className="h-4 w-4" />
                      Download Original Site ZIP
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {status.step === "idle" && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Build Site&quot; to generate the website.
              {isRebuild && " The existing site will be crawled first to preserve content and structure."}
              {" "}You can preview it and download the ZIP to deploy manually.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Crawl Results (shown when crawl data exists) */}
      {crawlData && crawlData.pages.length > 0 && (
        <Card className="border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Site Crawl Results
              <Badge variant="secondary" className="ml-auto text-green-600 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {crawlData.pages.length} pages
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats grid */}
            {pageStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{pageStats.withMarkdown}</p>
                  <p className="text-[10px] text-muted-foreground">Content Pages</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Code className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{pageStats.withHtml}</p>
                  <p className="text-[10px] text-muted-foreground">HTML Captured</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Camera className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{pageStats.withScreenshots}</p>
                  <p className="text-[10px] text-muted-foreground">Screenshots</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Link2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{pageStats.totalLinks}</p>
                  <p className="text-[10px] text-muted-foreground">Links Found</p>
                </div>
              </div>
            )}

            {/* All discovered URLs (expandable) */}
            {crawlData.allUrls.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCrawlExpanded(!crawlExpanded)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  {crawlExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {crawlData.allUrls.length} URLs discovered
                </button>
                {crawlExpanded && (
                  <div className="rounded-lg border bg-muted/30 p-3 max-h-[300px] overflow-auto space-y-1">
                    {crawlData.allUrls.map((url) => (
                      <div key={url} className="flex items-center gap-2 text-xs group">
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">
                          {url}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scraped pages with screenshots */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPagesExpanded(!pagesExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors w-full"
              >
                {pagesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Scraped Pages
              </button>
              {pagesExpanded && (
                <div className="grid gap-2">
                  {crawlData.pages.slice(0, 12).map((page) => (
                    <div
                      key={page.url}
                      className="flex items-center gap-3 rounded-lg border p-2.5 text-sm"
                    >
                      {page.screenshot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={page.screenshot}
                          alt={page.metadata?.title || page.url}
                          className="h-12 w-20 rounded object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-20 rounded bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-xs">
                          {page.metadata?.title || "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {page.url}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {page.markdown && (
                          <Badge variant="outline" className="text-[10px] px-1.5">MD</Badge>
                        )}
                        {(page.html || page.rawHtml) && (
                          <Badge variant="outline" className="text-[10px] px-1.5">HTML</Badge>
                        )}
                        {page.screenshot && (
                          <Badge variant="outline" className="text-[10px] px-1.5">IMG</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {crawlData.pages.length > 12 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{crawlData.pages.length - 12} more pages
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Download actions */}
            <div className="flex justify-end gap-2 pt-1 border-t">
              <a
                href={`/api/projects/download?projectId=${projectId}&type=crawl`}
                download
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium px-2 py-1"
              >
                <Download className="h-3.5 w-3.5" />
                Original Site ZIP
              </a>
              <a
                href={`/api/projects/download?projectId=${projectId}&type=redirects`}
                download
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium px-2 py-1"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Redirects CSV
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Preview (shown when build is complete) */}
      {isComplete && hasBuild && (
        <SitePreview projectId={projectId} />
      )}
    </div>
  );
}
