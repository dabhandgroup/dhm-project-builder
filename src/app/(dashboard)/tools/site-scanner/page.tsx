"use client";

import { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Loader2,
  CheckCircle2,
  Globe,
  FileText,
  Code,
  Monitor,
  Smartphone,
  Link2,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Camera,
} from "lucide-react";

interface CrawlPage {
  url: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  screenshot?: string | null;
  mobileScreenshot?: string | null;
  links?: string[];
  metadata?: { title?: string; description?: string; [key: string]: unknown };
}

interface CrawlData {
  pages: CrawlPage[];
  allUrls: string[];
  domain: string;
  crawledAt: string;
}

export default function SiteScannerPage() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(50);
  const [crawling, setCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{
    completed: number;
    total: number;
    label?: string;
  } | null>(null);
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [urlsExpanded, setUrlsExpanded] = useState(false);
  const [pagesExpanded, setPagesExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasCrawlData = crawlData?.pages?.length && crawlData.pages.length > 0;

  const pageStats = hasCrawlData
    ? {
        withMarkdown: crawlData.pages.filter((p) => p.markdown).length,
        withHtml: crawlData.pages.filter((p) => p.html || p.rawHtml).length,
        withScreenshots: crawlData.pages.filter((p) => p.screenshot).length,
        withMobileScreenshots: crawlData.pages.filter((p) => p.mobileScreenshot).length,
        totalLinks: new Set(crawlData.pages.flatMap((p) => p.links || [])).size,
      }
    : null;

  // Build a prompt from crawl data
  const buildPrompt = useCallback((data: CrawlData) => {
    const lines: string[] = [];
    lines.push("You are rebuilding a website. Below is the complete crawled content from the existing site.");
    lines.push(`Domain: ${data.domain}`);
    lines.push(`Pages crawled: ${data.pages.length}`);
    lines.push(`URLs discovered: ${data.allUrls.length}`);
    lines.push("");

    lines.push("## Sitemap");
    for (const pageUrl of data.allUrls) {
      try {
        lines.push(`- ${new URL(pageUrl).pathname}`);
      } catch {
        lines.push(`- ${pageUrl}`);
      }
    }
    lines.push("");

    lines.push("## Page Content");
    for (const page of data.pages) {
      if (!page.markdown) continue;
      const title = page.metadata?.title || page.url;
      lines.push(`### ${title}`);
      lines.push(`URL: ${page.url}`);
      lines.push("");
      lines.push(page.markdown);
      lines.push("");
    }

    if (data.allUrls.length > 0) {
      lines.push("## 301 Redirects");
      lines.push("Create 301 redirects from these old URLs to their equivalent new pages:");
      for (const u of data.allUrls) {
        try {
          lines.push(`- ${new URL(u).pathname}`);
        } catch {
          lines.push(`- ${u}`);
        }
      }
    }

    return lines.join("\n");
  }, []);

  // Poll a crawl until complete
  async function pollCrawl(
    crawlId: string,
    totalHint: number,
    label: string,
  ): Promise<CrawlPage[] | null> {
    while (true) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(`/api/crawl/${crawlId}`);
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();

      setCrawlProgress({
        completed: statusData.completed || 0,
        total: statusData.total || totalHint,
        label,
      });

      if (statusData.status === "completed") {
        return statusData.data || [];
      } else if (statusData.status === "failed") {
        return null;
      }
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setCrawling(true);
    setCrawlProgress(null);
    setCrawlData(null);
    setPrompt("");

    const cleanUrl = url.trim().startsWith("http")
      ? url.trim()
      : `https://${url.trim()}`;

    try {
      // Desktop crawl
      const startRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, maxPages }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        toast({ title: err.error || "Failed to start scan", variant: "destructive" });
        setCrawling(false);
        return;
      }

      const { crawlId, allUrls } = await startRes.json();
      const desktopPages = await pollCrawl(crawlId, allUrls?.length || 0, "Desktop");

      if (!desktopPages) {
        toast({ title: "Desktop scan failed", variant: "destructive" });
        setCrawling(false);
        return;
      }

      // Mobile crawl (screenshots)
      setCrawlProgress({ completed: 0, total: desktopPages.length, label: "Mobile" });
      let mobileScreenshots: Record<string, string> = {};

      const mobileRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, maxPages: desktopPages.length, mobile: true }),
      });

      if (mobileRes.ok) {
        const { crawlId: mobileCrawlId } = await mobileRes.json();
        const mobilePages = await pollCrawl(mobileCrawlId, desktopPages.length, "Mobile");
        if (mobilePages) {
          for (const p of mobilePages) {
            if (p.screenshot) mobileScreenshots[p.url] = p.screenshot as string;
          }
        }
      }

      // Merge
      const mergedPages = desktopPages.map((p) => ({
        ...p,
        mobileScreenshot: mobileScreenshots[p.url] || null,
      }));

      let domain: string;
      try {
        domain = new URL(cleanUrl).hostname;
      } catch {
        domain = cleanUrl;
      }

      const data: CrawlData = {
        pages: mergedPages,
        allUrls: allUrls || [],
        domain,
        crawledAt: new Date().toISOString(),
      };

      setCrawlData(data);
      setPrompt(buildPrompt(data));
      toast({ title: `Scanned ${desktopPages.length} pages (desktop + mobile) from ${domain}` });
    } catch {
      toast({ title: "Scan failed", variant: "destructive" });
    } finally {
      setCrawling(false);
      setCrawlProgress(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({ title: "Prompt copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadSitemap() {
    if (!crawlData) return;
    const lines = crawlData.allUrls.join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${crawlData.domain}-sitemap.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleDownloadSiteZip() {
    if (!crawlData) return;
    // Build and download a ZIP client-side using the page data
    // For simplicity, trigger a download of markdown content
    const lines: string[] = [];
    for (const page of crawlData.pages) {
      if (!page.markdown) continue;
      lines.push(`# ${page.metadata?.title || page.url}`);
      lines.push(`URL: ${page.url}`);
      lines.push("");
      lines.push(page.markdown);
      lines.push("\n---\n");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${crawlData.domain}-content.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Scanner"
        description="Crawl any website to extract content, screenshots, and generate an AI prompt"
      />

      {/* URL Input */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="scan-url">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scan-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com"
                    className="pl-10"
                    disabled={crawling}
                  />
                </div>
              </div>
              <div className="w-24 space-y-2">
                <Label htmlFor="max-pages">Max pages</Label>
                <Input
                  id="max-pages"
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  min={1}
                  max={200}
                  disabled={crawling}
                />
              </div>
            </div>
            <Button type="submit" disabled={crawling || !url.trim()}>
              {crawling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {crawlProgress
                    ? `${crawlProgress.label || "Scanning"} ${crawlProgress.completed}/${crawlProgress.total}...`
                    : "Starting scan..."}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Scan Site
                </>
              )}
            </Button>

            {/* Progress bar */}
            {crawling && crawlProgress && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{crawlProgress.label} — Scanning...</span>
                  <span>{crawlProgress.completed}/{crawlProgress.total} pages</span>
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
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {hasCrawlData && (
        <>
          {/* Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Scan Results
                  <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-950">
                    {crawlData.pages.length} pages
                  </Badge>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {new Date(crawlData.crawledAt).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats grid */}
              {pageStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                    <Monitor className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.withScreenshots}</p>
                    <p className="text-[10px] text-muted-foreground">Desktop Shots</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Smartphone className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.withMobileScreenshots}</p>
                    <p className="text-[10px] text-muted-foreground">Mobile Shots</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Link2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.totalLinks}</p>
                    <p className="text-[10px] text-muted-foreground">Links Found</p>
                  </div>
                </div>
              )}

              {/* Discovered URLs */}
              {crawlData.allUrls.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setUrlsExpanded(!urlsExpanded)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    {urlsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {crawlData.allUrls.length} URLs discovered
                  </button>
                  {urlsExpanded && (
                    <div className="rounded-lg border bg-muted/30 p-3 max-h-[300px] overflow-auto space-y-1">
                      {crawlData.allUrls.map((u) => (
                        <div key={u} className="flex items-center gap-2 text-xs group">
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">{u}</span>
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
                  {pagesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Scraped Pages
                </button>
                {pagesExpanded && (
                  <div className="grid gap-2">
                    {crawlData.pages.slice(0, 12).map((page) => (
                      <div key={page.url} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
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
                          <p className="font-medium truncate text-xs">{page.metadata?.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground truncate">{page.url}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {page.markdown && <Badge variant="outline" className="text-[10px] px-1.5">MD</Badge>}
                          {(page.html || page.rawHtml) && <Badge variant="outline" className="text-[10px] px-1.5">HTML</Badge>}
                          {page.screenshot && <Badge variant="outline" className="text-[10px] px-1.5"><Monitor className="h-2.5 w-2.5" /></Badge>}
                          {page.mobileScreenshot && <Badge variant="outline" className="text-[10px] px-1.5"><Smartphone className="h-2.5 w-2.5" /></Badge>}
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
                <button
                  type="button"
                  onClick={handleDownloadSiteZip}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Content
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSitemap}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Download Sitemap
                </button>
              </div>
            </CardContent>
          </Card>

          {/* AI Prompt */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  AI Prompt
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs gap-1"
                >
                  {copied ? (
                    <><Check className="h-3 w-3" /> Copied</>
                  ) : (
                    <><Copy className="h-3 w-3" /> Copy</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Paste this prompt into Claude to rebuild the site. Includes all crawled content, sitemap, and redirect mappings.
              </p>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-md border border-input bg-muted/30 p-3 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y overflow-auto"
                style={{ minHeight: "200px", maxHeight: "800px" }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
