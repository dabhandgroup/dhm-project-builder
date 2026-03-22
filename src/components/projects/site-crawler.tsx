"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Loader2,
  Check,
  AlertCircle,
  FileText,
  Image,
  Code,
  Link2,
  Camera,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { CrawlPage } from "@/lib/firecrawl";
import { toast } from "@/components/ui/toast";

interface SiteCrawlerProps {
  domain: string;
  onCrawlComplete: (data: CrawlData) => void;
}

export interface CrawlData {
  pages: CrawlPage[];
  allUrls: string[];
  domain: string;
}

type CrawlState = "idle" | "mapping" | "crawling" | "complete" | "error";

export function SiteCrawler({ domain, onCrawlComplete }: SiteCrawlerProps) {
  const [state, setState] = useState<CrawlState>("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startCrawl = useCallback(async () => {
    if (!domain) return;

    setState("mapping");
    setError(null);
    setCrawlData(null);
    setProgress({ completed: 0, total: 0 });

    try {
      // Step 1: Start crawl (map + crawl in one call)
      const url = domain.startsWith("http") ? domain : `https://${domain}`;
      const startRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages: 50 }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error || "Failed to start crawl");
      }

      const { crawlId, allUrls, totalUrls } = await startRes.json();
      setProgress({ completed: 0, total: totalUrls });
      setState("crawling");

      // Step 2: Poll for crawl results
      const poll = async () => {
        try {
          const statusRes = await fetch(`/api/crawl/${crawlId}`);
          if (!statusRes.ok) return;

          const status = await statusRes.json();
          setProgress({
            completed: status.completed ?? 0,
            total: status.total ?? totalUrls,
          });

          if (status.status === "completed" && status.data) {
            if (pollingRef.current) clearInterval(pollingRef.current);

            const result: CrawlData = {
              pages: status.data,
              allUrls,
              domain,
            };
            setCrawlData(result);
            setState("complete");
            onCrawlComplete(result);
            toast({
              title: "Site crawled successfully",
              description: `${status.data.length} pages scraped`,
            });
          } else if (status.status === "failed") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            throw new Error("Crawl failed");
          }
        } catch (err) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          const msg = err instanceof Error ? err.message : "Crawl failed";
          setError(msg);
          setState("error");
        }
      };

      pollingRef.current = setInterval(poll, 3000);
      // First poll immediately
      poll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to crawl site";
      setError(msg);
      setState("error");
      toast({ title: "Crawl failed", description: msg, variant: "destructive" });
    }
  }, [domain, onCrawlComplete]);

  const pageStats = crawlData
    ? {
        withMarkdown: crawlData.pages.filter((p) => p.markdown).length,
        withHtml: crawlData.pages.filter((p) => p.html || p.rawHtml).length,
        withScreenshots: crawlData.pages.filter((p) => p.screenshot).length,
        totalLinks: new Set(crawlData.pages.flatMap((p) => p.links)).size,
      }
    : null;

  return (
    <Card className={state === "complete" ? "border-green-500/50" : "border-dashed"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Site Crawler
          {state === "complete" && (
            <Badge variant="secondary" className="ml-auto text-green-600 bg-green-50">
              <Check className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Idle state */}
        {state === "idle" && (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Crawl <span className="font-medium text-foreground">{domain}</span> to
              import existing content, pages, screenshots, and assets.
            </p>
            <Button onClick={startCrawl} className="gap-2">
              <Globe className="h-4 w-4" />
              Crawl & Import Site
            </Button>
          </div>
        )}

        {/* Mapping / Crawling state */}
        {(state === "mapping" || state === "crawling") && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {state === "mapping" ? "Discovering pages..." : "Crawling site..."}
                </p>
                {state === "crawling" && progress.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {progress.completed} / {progress.total} pages scraped
                  </p>
                )}
              </div>
            </div>
            {state === "crawling" && progress.total > 0 && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((progress.completed / progress.total) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {state === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={startCrawl} className="gap-2">
              <Globe className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Complete state */}
        {state === "complete" && crawlData && pageStats && (
          <div className="space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-semibold">{pageStats.withMarkdown}</p>
                <p className="text-[10px] text-muted-foreground">Pages</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <Code className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-semibold">{pageStats.withHtml}</p>
                <p className="text-[10px] text-muted-foreground">HTML</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <Camera className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-semibold">{pageStats.withScreenshots}</p>
                <p className="text-[10px] text-muted-foreground">Screenshots</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <Link2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-semibold">{pageStats.totalLinks}</p>
                <p className="text-[10px] text-muted-foreground">Links</p>
              </div>
            </div>

            {/* All discovered URLs */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {crawlData.allUrls.length} URLs discovered
              </button>
              {expanded && (
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

            {/* Scraped pages preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Scraped Pages
              </p>
              <div className="grid gap-2">
                {crawlData.pages.slice(0, 10).map((page) => (
                  <div
                    key={page.url}
                    className="flex items-center gap-3 rounded-lg border p-2.5 text-sm"
                  >
                    {page.screenshot ? (
                      <img
                        src={page.screenshot}
                        alt={page.metadata.title || page.url}
                        className="h-12 w-20 rounded object-cover border shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-20 rounded bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-xs">
                        {page.metadata.title || "Untitled"}
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
                {crawlData.pages.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{crawlData.pages.length - 10} more pages
                  </p>
                )}
              </div>
            </div>

            {/* Re-crawl option */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={startCrawl} className="gap-1.5 text-xs">
                <Globe className="h-3 w-3" />
                Re-crawl
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
