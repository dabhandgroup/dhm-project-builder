"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Loader2,
  CheckCircle2,
  Globe,
  FileText,
  Code,
  Camera,
  Link2,
  Download,
  Github,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";

interface CrawlPage {
  url: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  screenshot?: string | null;
  hasScreenshot?: boolean;
  links?: string[];
  metadata?: { title?: string; description?: string; [key: string]: unknown };
}

interface CrawlData {
  pages: CrawlPage[];
  allUrls?: string[];
  domain?: string;
  crawledAt?: string;
}

interface SiteScanCardProps {
  projectId: string;
  projectTitle: string;
  domainName?: string | null;
  onCrawlComplete?: (data: CrawlData) => void;
}

export function SiteScanCard({
  projectId,
  projectTitle,
  domainName,
  onCrawlComplete,
}: SiteScanCardProps) {
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [pushingGithub, setPushingGithub] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState<string | null>(null);
  const [urlsExpanded, setUrlsExpanded] = useState(false);
  const [pagesExpanded, setPagesExpanded] = useState(true);

  // Load existing crawl data
  const loadCrawlData = useCallback(async () => {
    setLoading(true);
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
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadCrawlData();
  }, [loadCrawlData]);

  // Run Firecrawl
  async function handleCrawl() {
    if (!domainName) {
      toast({
        title: "No domain set for this project",
        variant: "destructive",
      });
      return;
    }

    setCrawling(true);
    setCrawlProgress(null);
    try {
      const startRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://${domainName.replace(/^https?:\/\//, "")}`,
          maxPages: 50,
          projectId,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        toast({
          title: err.error || "Failed to start crawl",
          variant: "destructive",
        });
        setCrawling(false);
        return;
      }

      const { crawlId, allUrls } = await startRes.json();

      // Poll for completion
      let complete = false;
      while (!complete) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/crawl/${crawlId}`);
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();

        setCrawlProgress({
          completed: statusData.completed || 0,
          total: statusData.total || allUrls?.length || 0,
        });

        if (statusData.status === "completed") {
          complete = true;
          const crawlPayload: CrawlData = {
            pages: statusData.data || [],
            allUrls: allUrls || [],
            domain: domainName,
            crawledAt: new Date().toISOString(),
          };

          // Save to Supabase storage
          await fetch("/api/crawl/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              crawlData: crawlPayload,
            }),
          });

          setCrawlData(crawlPayload);
          onCrawlComplete?.(crawlPayload);
          toast({
            title: `Crawled ${statusData.data?.length || 0} pages from ${domainName}`,
          });
        } else if (statusData.status === "failed") {
          complete = true;
          toast({ title: "Crawl failed", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Crawl failed", variant: "destructive" });
    } finally {
      setCrawling(false);
      setCrawlProgress(null);
    }
  }

  // Push crawl to GitHub
  async function handlePushGithub() {
    setPushingGithub(true);
    try {
      const res = await fetch("/api/crawl/push-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectTitle,
          domainName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: err.error || "Failed to push to GitHub",
          variant: "destructive",
        });
        setPushingGithub(false);
        return;
      }

      const data = await res.json();
      setGithubRepoUrl(data.repoUrl);
      toast({ title: `Pushed to GitHub: ${data.repoName}` });
    } catch {
      toast({ title: "Failed to push to GitHub", variant: "destructive" });
    } finally {
      setPushingGithub(false);
    }
  }

  const hasCrawlData =
    crawlData?.pages?.length && crawlData.pages.length > 0;
  const pageStats = hasCrawlData
    ? {
        withMarkdown: crawlData.pages.filter((p) => p.markdown).length,
        withHtml: crawlData.pages.filter(
          (p) => p.html || p.rawHtml,
        ).length,
        withScreenshots: crawlData.pages.filter(
          (p) => p.screenshot || p.hasScreenshot,
        ).length,
        totalLinks: new Set(crawlData.pages.flatMap((p) => p.links || [])).size,
      }
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Site Scan
            {hasCrawlData && (
              <Badge
                variant="secondary"
                className="ml-1 text-green-600 bg-green-50 dark:bg-green-950"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {crawlData.pages.length} pages
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {domainName && (
              <Button
                size="sm"
                onClick={handleCrawl}
                disabled={crawling || loading}
              >
                {crawling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {crawlProgress
                      ? `Scanning ${crawlProgress.completed}/${crawlProgress.total}...`
                      : "Starting scan..."}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {hasCrawlData ? "Re-scan" : "Scan Site"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Crawl progress bar */}
        {crawling && crawlProgress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Crawling {domainName}...</span>
              <span>
                {crawlProgress.completed}/{crawlProgress.total} pages
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-all duration-700 ease-out"
                style={{
                  width: `${crawlProgress.total > 0 ? (crawlProgress.completed / crawlProgress.total) * 100 : 0}%`,
                }}
              >
                <div className="h-full w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        )}

        {/* No data state */}
        {!loading && !hasCrawlData && !crawling && (
          <div className="text-center py-6 space-y-2">
            <Globe className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {domainName
                ? `Scan ${domainName} to discover pages, capture content, and download HTML for reference.`
                : "No domain set. Edit the project to add a domain."}
            </p>
          </div>
        )}

        {/* Results */}
        {hasCrawlData && (
          <>
            {/* Stats grid */}
            {pageStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {pageStats.withMarkdown}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Content Pages
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Code className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {pageStats.withHtml}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    HTML Captured
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Camera className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {pageStats.withScreenshots}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Screenshots
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <Link2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {pageStats.totalLinks}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Links Found
                  </p>
                </div>
              </div>
            )}

            {/* Crawled at */}
            {crawlData.crawledAt && (
              <p className="text-xs text-muted-foreground">
                Last scanned:{" "}
                {new Date(crawlData.crawledAt).toLocaleString()}
              </p>
            )}

            {/* All discovered URLs (expandable) */}
            {crawlData.allUrls && crawlData.allUrls.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setUrlsExpanded(!urlsExpanded)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  {urlsExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {crawlData.allUrls.length} URLs discovered
                </button>
                {urlsExpanded && (
                  <div className="rounded-lg border bg-muted/30 p-3 max-h-[300px] overflow-auto space-y-1">
                    {crawlData.allUrls.map((url) => (
                      <div
                        key={url}
                        className="flex items-center gap-2 text-xs group"
                      >
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

            {/* Scraped pages */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPagesExpanded(!pagesExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors w-full"
              >
                {pagesExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
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
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5"
                          >
                            MD
                          </Badge>
                        )}
                        {(page.html || page.rawHtml) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5"
                          >
                            HTML
                          </Badge>
                        )}
                        {(page.screenshot || page.hasScreenshot) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5"
                          >
                            IMG
                          </Badge>
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

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <a
                href={`/api/projects/download?projectId=${projectId}&type=crawl`}
                download
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-900"
              >
                <Download className="h-3.5 w-3.5" />
                Download Site ZIP
              </a>
              {pageStats && pageStats.withScreenshots > 0 && (
                <a
                  href={`/api/projects/download?projectId=${projectId}&type=screenshots`}
                  download
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-900"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Download Screenshots
                </a>
              )}
              <a
                href={`/api/projects/download?projectId=${projectId}&type=redirects`}
                download
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Redirects CSV
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePushGithub}
                disabled={pushingGithub}
                className="text-xs gap-1.5"
              >
                {pushingGithub ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Github className="h-3.5 w-3.5" />
                    Push to GitHub
                  </>
                )}
              </Button>
              {githubRepoUrl && (
                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  View on GitHub
                </a>
              )}
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && !crawling && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading scan data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
