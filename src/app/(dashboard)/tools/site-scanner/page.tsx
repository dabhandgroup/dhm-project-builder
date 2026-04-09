"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Sparkles,
  ImageIcon,
  Trash2,
  Eye,
  Clock,
  Package,
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

interface ScanSummary {
  id: string;
  domain: string;
  url: string;
  page_count: number;
  image_count: number;
  storage_key: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SiteScannerPage() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(200);
  const [crawling, setCrawling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{
    completed: number;
    total: number;
    label?: string;
  } | null>(null);
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [urlsExpanded, setUrlsExpanded] = useState(false);
  const [pagesExpanded, setPagesExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scan history
  const [pastScans, setPastScans] = useState<ScanSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load scan history on mount
  useEffect(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((d) => setPastScans(d.scans || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

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
      try { lines.push(`- ${new URL(pageUrl).pathname}`); } catch { lines.push(`- ${pageUrl}`); }
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
        try { lines.push(`- ${new URL(u).pathname}`); } catch { lines.push(`- ${u}`); }
      }
    }

    return lines.join("\n");
  }, []);

  // Poll a crawl/batch scrape until complete
  async function pollCrawl(crawlId: string, totalHint: number, label: string, type?: string): Promise<CrawlPage[] | null> {
    const typeParam = type ? `?type=${type}` : "";
    while (true) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(`/api/crawl/${crawlId}${typeParam}`);
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();
      setCrawlProgress({ completed: statusData.completed || 0, total: statusData.total || totalHint, label });
      if (statusData.status === "completed") return statusData.data || [];
      if (statusData.status === "failed") return null;
    }
  }

  // Save scan to backend
  async function saveScan(data: CrawlData): Promise<string | null> {
    setSaving(true);
    try {
      const res = await fetch("/api/scans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crawlData: data }),
      });
      if (!res.ok) {
        toast({ title: "Failed to save scan", variant: "destructive" });
        return null;
      }
      const { scanId } = await res.json();

      // Refresh history
      const histRes = await fetch("/api/scans");
      if (histRes.ok) {
        const d = await histRes.json();
        setPastScans(d.scans || []);
      }

      toast({ title: "Scan saved" });
      return scanId;
    } catch {
      toast({ title: "Failed to save scan", variant: "destructive" });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setCrawling(true);
    setCrawlProgress(null);
    setCrawlData(null);
    setPrompt("");
    setActiveScanId(null);

    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;

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

      const { crawlId, allUrls, type } = await startRes.json();
      const desktopPages = await pollCrawl(crawlId, allUrls?.length || 0, "Desktop", type);

      if (!desktopPages) {
        toast({ title: "Desktop scan failed", variant: "destructive" });
        setCrawling(false);
        return;
      }

      // Mobile crawl (screenshots)
      setCrawlProgress({ completed: 0, total: desktopPages.length, label: "Mobile" });
      const mobileScreenshots: Record<string, string> = {};

      const mobileRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, maxPages: desktopPages.length, mobile: true }),
      });

      if (mobileRes.ok) {
        const { crawlId: mobileCrawlId, type: mobileType } = await mobileRes.json();
        const mobilePages = await pollCrawl(mobileCrawlId, desktopPages.length, "Mobile", mobileType);
        if (mobilePages) {
          for (const p of mobilePages) {
            if (p.screenshot) mobileScreenshots[p.url] = p.screenshot as string;
          }
        }
      }

      const mergedPages = desktopPages.map((p) => ({
        ...p,
        mobileScreenshot: mobileScreenshots[p.url] || null,
      }));

      let domain: string;
      try { domain = new URL(cleanUrl).hostname; } catch { domain = cleanUrl; }

      const data: CrawlData = {
        pages: mergedPages,
        allUrls: allUrls || [],
        domain,
        crawledAt: new Date().toISOString(),
      };

      setCrawlData(data);
      setPrompt(buildPrompt(data));
      setCrawling(false);
      setCrawlProgress(null);

      toast({ title: `Scanned ${desktopPages.length} pages from ${domain}` });

      // Auto-save
      setCrawlProgress({ completed: 0, total: 1, label: "Saving" });
      const scanId = await saveScan(data);
      if (scanId) setActiveScanId(scanId);
      setCrawlProgress(null);
    } catch {
      toast({ title: "Scan failed", variant: "destructive" });
      setCrawling(false);
      setCrawlProgress(null);
    }
  }

  // Load a past scan
  async function loadScan(scanId: string) {
    try {
      const res = await fetch(`/api/scans/${scanId}`);
      if (!res.ok) {
        toast({ title: "Failed to load scan", variant: "destructive" });
        return;
      }
      const { data } = await res.json();
      // Reconstruct crawl data from manifest for display
      setCrawlData({
        pages: (data.pages || []).map((p: Record<string, unknown>) => ({
          url: p.url,
          markdown: p.hasMarkdown ? "(saved)" : undefined,
          html: p.hasHtml ? "(saved)" : undefined,
          screenshot: p.hasDesktopScreenshot ? "(saved)" : null,
          mobileScreenshot: p.hasMobileScreenshot ? "(saved)" : null,
          metadata: { title: p.title as string },
          links: [],
        })),
        allUrls: data.allUrls || [],
        domain: data.domain,
        crawledAt: data.crawledAt,
      });
      setActiveScanId(scanId);
      setPrompt(""); // Prompt not available from saved data
      toast({ title: `Loaded scan of ${data.domain}` });
    } catch {
      toast({ title: "Failed to load scan", variant: "destructive" });
    }
  }

  // Delete a scan
  async function deleteScan(scanId: string) {
    try {
      await fetch(`/api/scans/${scanId}`, { method: "DELETE" });
      setPastScans((prev) => prev.filter((s) => s.id !== scanId));
      if (activeScanId === scanId) {
        setCrawlData(null);
        setActiveScanId(null);
        setPrompt("");
      }
      toast({ title: "Scan deleted" });
    } catch {
      toast({ title: "Failed to delete scan", variant: "destructive" });
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({ title: "Prompt copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  // Download helper for saved scans
  function downloadUrl(scanId: string, type: string) {
    const a = document.createElement("a");
    a.href = `/api/scans/${scanId}/download?type=${type}`;
    a.download = "";
    a.click();
  }

  // Client-side ZIP downloads — work without Supabase
  function urlToPath(pageUrl: string): string {
    try {
      const p = new URL(pageUrl).pathname.replace(/^\//, "") || "home";
      return p.replace(/\/$/, "") || "home";
    } catch {
      return "home";
    }
  }

  async function screenshotToBuffer(screenshot: string): Promise<Uint8Array | null> {
    // Handle base64 data URI
    const base64Match = screenshot.match(/^data:image\/\w+;base64,(.+)$/);
    if (base64Match) {
      const binary = atob(base64Match[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    // Handle plain URL
    if (screenshot.startsWith("http")) {
      try {
        const res = await fetch(screenshot);
        if (!res.ok) return null;
        return new Uint8Array(await res.arrayBuffer());
      } catch { return null; }
    }
    return null;
  }

  async function downloadZipFromMemory(filter?: "content" | "html" | "screenshots" | "images") {
    if (!crawlData) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Process pages in parallel (especially important for screenshot URL fetches)
    await Promise.all(crawlData.pages.map(async (page) => {
      const pagePath = urlToPath(page.url);

      if (!filter || filter === "content") {
        if (page.markdown) {
          zip.file(`pages/${pagePath}/content.md`, page.markdown);
        }
      }

      if (!filter || filter === "html") {
        const htmlContent = page.rawHtml || page.html;
        if (htmlContent) {
          zip.file(`pages/${pagePath}/source.html`, htmlContent);
        }
      }

      if (!filter || filter === "screenshots") {
        if (page.screenshot && page.screenshot !== "(saved)") {
          const buf = await screenshotToBuffer(page.screenshot);
          if (buf) zip.file(`pages/${pagePath}/screenshot-desktop.png`, buf);
        }
        if (page.mobileScreenshot && page.mobileScreenshot !== "(saved)") {
          const buf = await screenshotToBuffer(page.mobileScreenshot);
          if (buf) zip.file(`pages/${pagePath}/screenshot-mobile.png`, buf);
        }
      }
    }));

    // For "images" filter, fetch images from HTML (separate from "all" to avoid blocking)
    if (filter === "images") {
      for (const page of crawlData.pages) {
        const pagePath = urlToPath(page.url);
        const htmlContent = page.rawHtml || page.html;
        if (!htmlContent) continue;
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let match;
        const seen = new Set<string>();
        let imgIdx = 0;
        while ((match = imgRegex.exec(htmlContent)) !== null && imgIdx < 30) {
          let src = match[1];
          if (src.startsWith("data:") || seen.has(src)) continue;
          try {
            src = new URL(src, page.url).href;
          } catch { continue; }
          if (seen.has(src)) continue;
          seen.add(src);
          try {
            const res = await fetch(src);
            if (!res.ok) continue;
            const ct = res.headers.get("content-type") || "";
            if (!ct.startsWith("image/")) continue;
            const ext = ct.includes("png") ? "png" : ct.includes("gif") ? "gif" : ct.includes("webp") ? "webp" : ct.includes("svg") ? "svg" : "jpg";
            const buf = await res.arrayBuffer();
            if (buf.byteLength < 100 || buf.byteLength > 5_000_000) continue;
            zip.file(`pages/${pagePath}/images/image-${imgIdx}.${ext}`, buf);
            imgIdx++;
          } catch { /* skip */ }
        }
      }
    }

    // Include sitemap + manifest in "all" downloads
    if (!filter) {
      if (crawlData.allUrls.length > 0) {
        zip.file("sitemap.txt", crawlData.allUrls.join("\n"));
      }
      zip.file("data.json", JSON.stringify({
        domain: crawlData.domain,
        crawledAt: crawlData.crawledAt,
        pageCount: crawlData.pages.length,
        pages: crawlData.pages.map(p => ({
          url: p.url,
          title: p.metadata?.title || null,
        })),
      }, null, 2));
    }

    // For "content" filter, also include a combined full-site markdown
    if (filter === "content" || !filter) {
      const combined: string[] = [];
      combined.push(`# ${crawlData.domain}\n`);
      combined.push(`Crawled: ${crawlData.crawledAt}\n`);
      combined.push(`Pages: ${crawlData.pages.length}\n`);
      combined.push("---\n");
      for (const page of crawlData.pages) {
        if (!page.markdown) continue;
        const title = page.metadata?.title || page.url;
        combined.push(`\n## ${title}\n`);
        combined.push(`URL: ${page.url}\n`);
        combined.push(page.markdown);
        combined.push("\n\n---\n");
      }
      zip.file("full-site.md", combined.join("\n"));
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    const suffix = filter || "all";
    a.href = URL.createObjectURL(blob);
    a.download = `${crawlData.domain}-${suffix}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadSitemapFromMemory() {
    if (!crawlData?.allUrls.length) return;
    const blob = new Blob([crawlData.allUrls.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${crawlData.domain}-sitemap.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Scanner"
        description="Crawl any website to extract content, screenshots, images, and generate an AI prompt"
      />

      {/* Past Scans */}
      {(loadingHistory || pastScans.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Past Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {pastScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{scan.domain}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{timeAgo(scan.created_at)}</span>
                        <span>&middot;</span>
                        <span>{scan.page_count} pages</span>
                        {scan.image_count > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{scan.image_count} images</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => loadScan(scan.id)}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => downloadUrl(scan.id, "all")}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                        onClick={() => deleteScan(scan.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    disabled={crawling || saving}
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
                  disabled={crawling || saving}
                />
              </div>
            </div>
            <Button type="submit" disabled={crawling || saving || !url.trim()}>
              {crawling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {crawlProgress
                    ? `${crawlProgress.label || "Scanning"} ${crawlProgress.completed}/${crawlProgress.total}...`
                    : "Starting scan..."}
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving scan data...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Scan Site
                </>
              )}
            </Button>

            {/* Progress bar */}
            {(crawling || saving) && crawlProgress && crawlProgress.label !== "Saving" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{crawlProgress.label} — Scanning...</span>
                  <span>{crawlProgress.completed}/{crawlProgress.total} pages</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-all duration-700 ease-out"
                    style={{ width: `${crawlProgress.total > 0 ? (crawlProgress.completed / crawlProgress.total) * 100 : 0}%` }}
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
                  Scan Results — {crawlData.domain}
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
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.withMarkdown}</p>
                    <p className="text-[10px] text-muted-foreground">Content</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Code className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.withHtml}</p>
                    <p className="text-[10px] text-muted-foreground">HTML</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Monitor className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.withScreenshots}</p>
                    <p className="text-[10px] text-muted-foreground">Desktop</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Smartphone className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.withMobileScreenshots}</p>
                    <p className="text-[10px] text-muted-foreground">Mobile</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <Link2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{pageStats.totalLinks}</p>
                    <p className="text-[10px] text-muted-foreground">Links</p>
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
                        {page.screenshot && page.screenshot !== "(saved)" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={page.screenshot}
                            alt={page.metadata?.title || page.url}
                            className="h-12 w-20 rounded object-cover border shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-20 rounded bg-muted flex items-center justify-center shrink-0">
                            {page.screenshot === "(saved)" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
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

              {/* Download buttons — always available from in-memory data */}
              <div className="space-y-3 pt-2 border-t">
                {/* Primary: Download All */}
                <Button
                  className="w-full gap-2"
                  onClick={() => downloadZipFromMemory()}
                >
                  <Package className="h-4 w-4" />
                  Download All (MD + HTML + Screenshots + Sitemap)
                </Button>

                {/* Individual downloads */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadZipFromMemory("content")}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Content (MD)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadZipFromMemory("html")}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                  >
                    <Code className="h-3.5 w-3.5" />
                    HTML Source
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadZipFromMemory("screenshots")}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Screenshots
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadZipFromMemory("images")}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Page Images
                  </button>
                  <button
                    type="button"
                    onClick={downloadSitemapFromMemory}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-2 border"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Sitemap
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Prompt */}
          {prompt && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
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
          )}
        </>
      )}
    </div>
  );
}
