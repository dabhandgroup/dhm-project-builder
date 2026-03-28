"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Sparkles, Copy, Check, RefreshCw, Loader2 } from "lucide-react";

interface CrawlPage {
  url: string;
  title?: string;
  markdown?: string;
}

interface CrawlData {
  pages: CrawlPage[];
  allUrls?: string[];
}

interface AiPromptCardProps {
  projectId: string;
  brief: string;
  pagesRequired?: string | null;
  domainName?: string | null;
  isRebuild: boolean;
  clientName: string;
  targetLocations?: string[] | null;
  additionalNotes?: string | null;
  contactInfo?: { phone?: string; email?: string; address?: string } | null;
}

function buildPrompt(props: AiPromptCardProps, crawlData: CrawlData | null): string {
  const lines: string[] = [];

  lines.push("You are building a website for a client. Use the information below to create a complete, modern, responsive website.");
  lines.push("");
  lines.push("## Project");
  lines.push(`- Client: ${props.clientName}`);
  if (props.domainName) lines.push(`- Domain: ${props.domainName}`);
  lines.push(`- Type: ${props.isRebuild ? "Rebuild (replacing existing site)" : "New Build"}`);

  if (props.contactInfo) {
    const ci = props.contactInfo;
    if (ci.phone || ci.email || ci.address) {
      lines.push("");
      lines.push("## Contact Info");
      if (ci.phone) lines.push(`- Phone: ${ci.phone}`);
      if (ci.email) lines.push(`- Email: ${ci.email}`);
      if (ci.address) lines.push(`- Address: ${ci.address}`);
    }
  }

  if (props.brief) {
    lines.push("");
    lines.push("## Brief");
    lines.push(props.brief);
  }

  if (props.pagesRequired) {
    lines.push("");
    lines.push("## Pages Required");
    lines.push(props.pagesRequired);
  }

  if (props.targetLocations?.length) {
    lines.push("");
    lines.push("## Target Locations");
    lines.push(props.targetLocations.join(", "));
  }

  if (props.additionalNotes) {
    lines.push("");
    lines.push("## Additional Notes");
    lines.push(props.additionalNotes);
  }

  if (crawlData?.pages?.length) {
    lines.push("");
    lines.push("## Existing Site Content");
    lines.push("Below is the crawled content from the existing website. Use this for tone, content, and structure reference.");
    lines.push("");
    for (const page of crawlData.pages) {
      if (!page.markdown) continue;
      lines.push(`### Page: ${page.url}${page.title ? ` — ${page.title}` : ""}`);
      lines.push(page.markdown);
      lines.push("");
    }
  }

  if (crawlData?.allUrls?.length) {
    lines.push("");
    lines.push("## All Discovered URLs (for 301 redirects)");
    lines.push("Create 301 redirects from these old URLs to their equivalent new pages:");
    for (const url of crawlData.allUrls) {
      try {
        const path = new URL(url).pathname;
        lines.push(`- ${path}`);
      } catch {
        lines.push(`- ${url}`);
      }
    }
  }

  lines.push("");
  lines.push("## Instructions");
  lines.push("1. Create a Next.js 14+ project with App Router");
  lines.push("2. Use Tailwind CSS for styling");
  lines.push("3. Make all pages responsive (mobile-first)");
  lines.push("4. Include proper SEO meta tags on every page");
  if (props.isRebuild) {
    lines.push("5. Preserve all existing page URLs for SEO (create equivalent pages)");
  }
  lines.push(`${props.isRebuild ? "6" : "5"}. Use semantic HTML`);
  lines.push(`${props.isRebuild ? "7" : "6"}. Include a sitemap.xml`);
  lines.push(`${props.isRebuild ? "8" : "7"}. Create a clean, modern design that matches the business type`);
  if (props.isRebuild) {
    lines.push("9. Use the existing content as a starting point but improve where needed");
  }

  return lines.join("\n");
}

export function AiPromptCard(props: AiPromptCardProps) {
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchCrawlData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crawl/load?projectId=${props.projectId}`);
      if (res.ok) {
        const data = await res.json();
        setCrawlData(data.crawlData);
      }
    } catch {
      // Non-fatal
    }
    setLoading(false);
  }, [props.projectId]);

  useEffect(() => {
    fetchCrawlData();
  }, [fetchCrawlData]);

  const prompt = buildPrompt(props, crawlData);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({ title: "Prompt copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Prompt
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {props.isRebuild && (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchCrawlData}
                disabled={loading}
                className="h-7 text-xs gap-1"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Refresh
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Copy this prompt into a Claude session to build the website manually.
          {crawlData?.pages?.length
            ? ` Includes ${crawlData.pages.length} crawled page${crawlData.pages.length === 1 ? "" : "s"} from the existing site.`
            : props.isRebuild
              ? " Crawl data not yet available — scrape the existing site first."
              : ""}
        </p>
        <textarea
          readOnly
          value={prompt}
          className="w-full h-64 rounded-md border bg-muted/30 p-3 text-xs font-mono text-muted-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </CardContent>
    </Card>
  );
}
