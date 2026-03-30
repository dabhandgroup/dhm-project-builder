"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Sparkles, Copy, Check, RefreshCw, Loader2, Globe, Search } from "lucide-react";
import { updateProject } from "@/actions/projects";

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
  initialPrompt?: string | null;
  globalPrompt?: string | null;
}

function buildPrompt(props: AiPromptCardProps, crawlData: CrawlData | null): string {
  const lines: string[] = [];

  // Global prompt at the top if set
  if (props.globalPrompt?.trim()) {
    lines.push(props.globalPrompt.trim());
    lines.push("");
    lines.push("---");
    lines.push("");
  }

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

  // Editable prompt state
  const [prompt, setPrompt] = useState(props.initialPrompt || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptInitializedRef = useRef(false);

  // Crawl state
  const [crawling, setCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{ completed: number; total: number } | null>(null);

  const fetchCrawlData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crawl/load?projectId=${props.projectId}`);
      if (res.ok) {
        const data = await res.json();
        setCrawlData(data.crawlData);
        return data.crawlData;
      }
    } catch {
      // Non-fatal
    }
    setLoading(false);
    return null;
  }, [props.projectId]);

  // Generate and set prompt from data
  const regeneratePrompt = useCallback((data: CrawlData | null) => {
    const generated = buildPrompt(props, data);
    setPrompt(generated);
    // Auto-save the generated prompt
    updateProject(props.projectId, { ai_prompt: generated }).catch(() => {});
  }, [props]);

  useEffect(() => {
    fetchCrawlData().then((data) => {
      setLoading(false);
      // If user has a saved prompt, use it. Otherwise generate.
      if (props.initialPrompt && !promptInitializedRef.current) {
        promptInitializedRef.current = true;
        setPrompt(props.initialPrompt);
      } else if (!promptInitializedRef.current) {
        promptInitializedRef.current = true;
        regeneratePrompt(data);
      }
    });
  }, [fetchCrawlData, props.initialPrompt, regeneratePrompt]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 600)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [prompt, autoResize]);

  // Save prompt on edit
  function handlePromptChange(value: string) {
    setPrompt(value);
    autoResize();
    setSaved(false);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateProject(props.projectId, { ai_prompt: value });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    }, 1000);
  }

  // Start a crawl
  async function handleCrawl() {
    if (!props.domainName) {
      toast({ title: "No domain set for this project", variant: "destructive" });
      return;
    }

    setCrawling(true);
    setCrawlProgress(null);
    try {
      // Start crawl
      const startRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://${props.domainName.replace(/^https?:\/\//, "")}`,
          maxPages: 50,
          projectId: props.projectId,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        toast({ title: err.error || "Failed to start crawl", variant: "destructive" });
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
          // Save crawl data
          const crawlDataPayload = {
            pages: statusData.data || [],
            allUrls: allUrls || [],
            domain: props.domainName,
          };

          await fetch("/api/crawl/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: props.projectId,
              crawlData: crawlDataPayload,
            }),
          });

          setCrawlData(crawlDataPayload);
          regeneratePrompt(crawlDataPayload);
          toast({ title: `Crawled ${statusData.data?.length || 0} pages` });
        } else if (statusData.status === "failed") {
          complete = true;
          toast({ title: "Crawl failed", variant: "destructive" });
        }
      }
    } catch (err) {
      toast({ title: "Crawl failed", variant: "destructive" });
    } finally {
      setCrawling(false);
      setCrawlProgress(null);
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({ title: "Prompt copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCrawlData = crawlData?.pages?.length && crawlData.pages.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Prompt
            {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            {saved && <Check className="h-3 w-3 text-green-500" />}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {/* Crawl button */}
            {props.domainName && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCrawl}
                disabled={crawling || loading}
                className="h-7 text-xs gap-1"
              >
                {crawling ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {crawlProgress
                      ? `${crawlProgress.completed}/${crawlProgress.total}`
                      : "Crawling..."}
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3" />
                    {hasCrawlData ? "Re-crawl" : "Crawl Site"}
                  </>
                )}
              </Button>
            )}
            {/* Regenerate */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => regeneratePrompt(crawlData)}
              disabled={loading}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
            {/* Copy */}
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
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {hasCrawlData ? (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-green-500" />
              {crawlData.pages.length} page{crawlData.pages.length === 1 ? "" : "s"} crawled
            </span>
          ) : props.domainName ? (
            <span className="flex items-center gap-1 text-amber-600">
              <Globe className="h-3 w-3" />
              No crawl data — click &quot;Crawl Site&quot; to fetch content from {props.domainName}
            </span>
          ) : (
            <span>No domain set</span>
          )}
        </div>

        {/* Editable prompt textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          className="w-full rounded-md border border-input bg-muted/30 p-3 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
          style={{ minHeight: "200px", maxHeight: "600px" }}
        />
        <p className="text-xs text-muted-foreground">
          Click to edit. Changes save automatically. Use &quot;Regenerate&quot; to rebuild from project data.
        </p>
      </CardContent>
    </Card>
  );
}
