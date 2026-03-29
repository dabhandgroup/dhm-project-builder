"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// --- Types ---

interface CrawlPage {
  url: string;
  title?: string;
  markdown?: string;
}

interface RedirectRow {
  from: string;
  to: string;
  status_code: number;
  reason: string;
}

interface SavedPlan {
  id: string;
  name: string;
  original_url: string;
  new_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FullPlan extends SavedPlan {
  comments: string | null;
  original_pages: CrawlPage[];
  new_pages: CrawlPage[];
  original_urls: string[];
  new_urls: string[];
  redirects: RedirectRow[];
}

type CrawlState = "idle" | "mapping" | "crawling" | "complete" | "error";

// --- Component ---

export default function RedirectPlannerPage() {
  // Form inputs
  const [name, setName] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [comments, setComments] = useState("");

  // Crawl state
  const [originalCrawlState, setOriginalCrawlState] = useState<CrawlState>("idle");
  const [newCrawlState, setNewCrawlState] = useState<CrawlState>("idle");
  const [originalPages, setOriginalPages] = useState<CrawlPage[]>([]);
  const [newPages, setNewPages] = useState<CrawlPage[]>([]);
  const [originalUrls, setOriginalUrls] = useState<string[]>([]);
  const [newUrls, setNewUrls] = useState<string[]>([]);
  const [originalProgress, setOriginalProgress] = useState("");
  const [newProgress, setNewProgress] = useState("");

  // Redirects
  const [redirects, setRedirects] = useState<RedirectRow[]>([]);
  const [generating, setGenerating] = useState(false);

  // Saved plans
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(true);

  // Polling refs
  const originalPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const newPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Load saved plans on mount
  useEffect(() => {
    fetch("/api/redirect-planner")
      .then((r) => r.json())
      .then((d) => setSavedPlans(d.plans || []))
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (originalPollRef.current) clearInterval(originalPollRef.current);
      if (newPollRef.current) clearInterval(newPollRef.current);
    };
  }, []);

  // --- Crawl helpers ---

  const startCrawl = useCallback(async (
    url: string,
    side: "original" | "new",
  ) => {
    const setCrawlState = side === "original" ? setOriginalCrawlState : setNewCrawlState;
    const setPages = side === "original" ? setOriginalPages : setNewPages;
    const setUrls = side === "original" ? setOriginalUrls : setNewUrls;
    const setProgress = side === "original" ? setOriginalProgress : setNewProgress;
    const pollRef = side === "original" ? originalPollRef : newPollRef;

    setCrawlState("mapping");
    setProgress("Discovering pages...");
    setPages([]);
    setUrls([]);

    try {
      // Start the crawl via existing API
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start crawl");
      }

      const data = await res.json();
      setUrls(data.allUrls || []);
      setProgress(`Found ${data.allUrls?.length || 0} URLs, crawling pages...`);
      setCrawlState("crawling");

      // Poll for crawl completion
      const crawlId = data.crawlId;
      if (!crawlId) {
        // If no crawl ID, the site map was all we got
        setCrawlState("complete");
        setProgress(`Mapped ${data.allUrls?.length || 0} URLs`);
        return;
      }

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/crawl/${crawlId}`);
          if (!statusRes.ok) return;

          const status = await statusRes.json();
          setProgress(`Crawled ${status.completed || 0} / ${status.total || "?"} pages`);

          if (status.status === "completed" && status.data) {
            clearInterval(pollRef.current);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pages: CrawlPage[] = status.data.map((p: any) => ({
              url: p.url || p.metadata?.sourceURL || "",
              title: p.metadata?.title || undefined,
              markdown: p.markdown,
            }));
            setPages(pages);
            setCrawlState("complete");
            setProgress(`Crawled ${pages.length} pages`);
          }

          if (status.status === "failed") {
            clearInterval(pollRef.current);
            setCrawlState("error");
            setProgress("Crawl failed");
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch (err) {
      setCrawlState("error");
      setProgress(err instanceof Error ? err.message : "Crawl failed");
      toast({ title: "Crawl failed", variant: "destructive" });
    }
  }, []);

  const startBothCrawls = useCallback(() => {
    if (!originalUrl.trim() || !newUrl.trim()) return;
    startCrawl(originalUrl.trim(), "original");
    startCrawl(newUrl.trim(), "new");
  }, [originalUrl, newUrl, startCrawl]);

  const bothComplete = originalCrawlState === "complete" && newCrawlState === "complete";
  const anyCrawling = ["mapping", "crawling"].includes(originalCrawlState) ||
    ["mapping", "crawling"].includes(newCrawlState);

  // --- AI generate redirects ---

  const generateRedirects = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/redirect-planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrls,
          newUrls,
          originalPages,
          newPages,
          comments,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setRedirects(data.redirects || []);
      toast({ title: `Generated ${data.redirects?.length || 0} redirects` });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to generate redirects", variant: "destructive" });
    }
    setGenerating(false);
  }, [originalUrls, newUrls, originalPages, newPages, comments]);

  // --- Save/Load ---

  const savePlan = useCallback(async () => {
    const planName = name.trim() || `${originalUrl} → ${newUrl}`;
    setSaving(true);

    try {
      if (activePlanId) {
        // Update existing
        await fetch(`/api/redirect-planner/${activePlanId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: planName,
            original_url: originalUrl,
            new_url: newUrl,
            comments,
            original_pages: originalPages,
            new_pages: newPages,
            original_urls: originalUrls,
            new_urls: newUrls,
            redirects,
            status: redirects.length > 0 ? "complete" : "draft",
          }),
        });
        toast({ title: "Plan updated" });
      } else {
        // Create new
        const res = await fetch("/api/redirect-planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: planName,
            original_url: originalUrl,
            new_url: newUrl,
            comments,
            original_pages: originalPages,
            new_pages: newPages,
            original_urls: originalUrls,
            new_urls: newUrls,
            redirects,
            status: redirects.length > 0 ? "complete" : "draft",
          }),
        });
        const data = await res.json();
        if (data.id) setActivePlanId(data.id);
        toast({ title: "Plan saved" });
      }

      // Refresh list
      const listRes = await fetch("/api/redirect-planner");
      const listData = await listRes.json();
      setSavedPlans(listData.plans || []);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  }, [name, originalUrl, newUrl, comments, originalPages, newPages, originalUrls, newUrls, redirects, activePlanId]);

  const loadPlan = useCallback(async (planId: string) => {
    try {
      const res = await fetch(`/api/redirect-planner/${planId}`);
      const data = await res.json();
      const plan: FullPlan = data.plan;

      setActivePlanId(plan.id);
      setName(plan.name);
      setOriginalUrl(plan.original_url);
      setNewUrl(plan.new_url);
      setComments(plan.comments || "");
      setOriginalPages(plan.original_pages || []);
      setNewPages(plan.new_pages || []);
      setOriginalUrls(plan.original_urls || []);
      setNewUrls(plan.new_urls || []);
      setRedirects(plan.redirects || []);

      // Set crawl states based on loaded data
      if ((plan.original_pages || []).length > 0 || (plan.original_urls || []).length > 0) {
        setOriginalCrawlState("complete");
        setOriginalProgress(`${plan.original_pages?.length || 0} pages loaded`);
      }
      if ((plan.new_pages || []).length > 0 || (plan.new_urls || []).length > 0) {
        setNewCrawlState("complete");
        setNewProgress(`${plan.new_pages?.length || 0} pages loaded`);
      }

      setShowSavedPlans(false);
      toast({ title: "Plan loaded" });
    } catch {
      toast({ title: "Failed to load plan", variant: "destructive" });
    }
  }, []);

  const deletePlan = useCallback(async (planId: string) => {
    try {
      await fetch(`/api/redirect-planner/${planId}`, { method: "DELETE" });
      setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
      if (activePlanId === planId) setActivePlanId(null);
      toast({ title: "Plan deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }, [activePlanId]);

  const resetForm = () => {
    setActivePlanId(null);
    setName("");
    setOriginalUrl("");
    setNewUrl("");
    setComments("");
    setOriginalPages([]);
    setNewPages([]);
    setOriginalUrls([]);
    setNewUrls([]);
    setRedirects([]);
    setOriginalCrawlState("idle");
    setNewCrawlState("idle");
    setOriginalProgress("");
    setNewProgress("");
  };

  // --- Export ---

  const generateCsv = (): string => {
    const rows = [
      "old_path,new_path,status_code,reason",
      ...redirects.map((r) =>
        `"${r.from}","${r.to}",${r.status_code},"${(r.reason || "").replace(/"/g, '""')}"`
      ),
    ];
    return rows.join("\n");
  };

  const downloadCsv = () => {
    const csv = generateCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redirects-${name || "plan"}.csv`.replace(/[^a-z0-9.-]/gi, "-");
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTsv = () => {
    const rows = [
      "Old Path\tNew Path\tStatus\tReason",
      ...redirects.map((r) => `${r.from}\t${r.to}\t${r.status_code}\t${r.reason || ""}`),
    ];
    navigator.clipboard.writeText(rows.join("\n"));
    toast({ title: "Copied as TSV — paste into Google Sheets" });
  };

  const openGoogleSheets = () => {
    window.open("https://sheets.new", "_blank");
    // Small delay then copy TSV
    setTimeout(() => {
      copyTsv();
    }, 500);
  };

  // --- Edit redirect row ---

  const updateRedirect = (index: number, field: keyof RedirectRow, value: string | number) => {
    setRedirects((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const removeRedirect = (index: number) => {
    setRedirects((prev) => prev.filter((_, i) => i !== index));
  };

  const addRedirect = () => {
    setRedirects((prev) => [...prev, { from: "/", to: "/", status_code: 301, reason: "" }]);
  };

  // --- Render helpers ---

  function CrawlStatus({ state, progress, label }: { state: CrawlState; progress: string; label: string }) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {state === "idle" && <Globe className="h-4 w-4 text-muted-foreground" />}
        {(state === "mapping" || state === "crawling") && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        )}
        {state === "complete" && <Check className="h-4 w-4 text-green-500" />}
        {state === "error" && <span className="h-4 w-4 text-red-500">!</span>}
        <span className="font-medium">{label}</span>
        {progress && <span className="text-muted-foreground">— {progress}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redirect Planner"
        description="Crawl old + new sites, generate 301 redirect mappings with AI"
      />

      {/* Saved Plans */}
      <Card>
        <CardHeader className="pb-2">
          <button
            type="button"
            onClick={() => setShowSavedPlans(!showSavedPlans)}
            className="flex items-center gap-2 text-left"
          >
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Saved Plans ({savedPlans.length})
            </CardTitle>
            {showSavedPlans ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showSavedPlans && (
          <CardContent>
            {loadingPlans ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : savedPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No saved plans yet. Create one below.
              </p>
            ) : (
              <div className="divide-y">
                {savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <button
                      type="button"
                      onClick={() => loadPlan(plan.id)}
                      className="text-left min-w-0 flex-1 hover:text-primary transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{plan.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {plan.original_url} → {plan.new_url}
                        <span className="ml-2">
                          {new Date(plan.updated_at).toLocaleDateString()}
                        </span>
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePlan(plan.id)}
                      className="shrink-0 h-7 w-7 p-0 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              {activePlanId ? "Edit Plan" : "New Redirect Plan"}
            </CardTitle>
            {activePlanId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name (optional)</Label>
            <Input
              id="planName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elk Building migration"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="originalUrl">Original Site URL</Label>
              <Input
                id="originalUrl"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://old-site.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUrl">New Site URL</Label>
              <Input
                id="newUrl"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://new-site.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">
              Comments / Notes
              <span className="text-xs text-muted-foreground ml-1 font-normal">
                (e.g. &quot;delete /old-blog, forward /services to /what-we-do&quot;)
              </span>
            </Label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any notes about specific pages to delete, merge, or redirect. The AI will factor these in."
              className="w-full rounded-md border bg-background p-3 text-sm resize-y min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
            />
          </div>

          {/* Crawl status */}
          {(originalCrawlState !== "idle" || newCrawlState !== "idle") && (
            <div className="rounded-lg border p-3 space-y-2">
              <CrawlStatus state={originalCrawlState} progress={originalProgress} label="Original site" />
              <CrawlStatus state={newCrawlState} progress={newProgress} label="New site" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={startBothCrawls}
              disabled={!originalUrl.trim() || !newUrl.trim() || anyCrawling}
              className="gap-2"
            >
              {anyCrawling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Crawling...
                </>
              ) : bothComplete ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Re-crawl Both Sites
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Crawl Both Sites
                </>
              )}
            </Button>

            {bothComplete && (
              <Button
                onClick={generateRedirects}
                disabled={generating}
                variant="outline"
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Redirects with AI
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redirect Table */}
      {redirects.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Redirects ({redirects.length})
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={addRedirect} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Add Row
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCsv} className="h-7 text-xs gap-1">
                  <Download className="h-3 w-3" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={copyTsv} className="h-7 text-xs gap-1">
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={openGoogleSheets} className="h-7 text-xs gap-1">
                  <FileSpreadsheet className="h-3 w-3" /> Google Sheets
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium">Old Path</th>
                    <th className="pb-2 pr-2 font-medium">New Path</th>
                    <th className="pb-2 pr-2 font-medium w-16">Code</th>
                    <th className="pb-2 pr-2 font-medium">Reason</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {redirects.map((row, i) => (
                    <tr key={i} className="group">
                      <td className="py-1.5 pr-2">
                        <input
                          value={row.from}
                          onChange={(e) => updateRedirect(i, "from", e.target.value)}
                          className="w-full bg-transparent text-sm font-mono focus:outline-none focus:bg-accent/50 rounded px-1 py-0.5"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={row.to}
                          onChange={(e) => updateRedirect(i, "to", e.target.value)}
                          className="w-full bg-transparent text-sm font-mono focus:outline-none focus:bg-accent/50 rounded px-1 py-0.5"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <select
                          value={row.status_code}
                          onChange={(e) => updateRedirect(i, "status_code", Number(e.target.value))}
                          className="bg-transparent text-sm focus:outline-none cursor-pointer"
                        >
                          <option value={301}>301</option>
                          <option value={302}>302</option>
                          <option value={410}>410</option>
                        </select>
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={row.reason}
                          onChange={(e) => updateRedirect(i, "reason", e.target.value)}
                          className="w-full bg-transparent text-sm text-muted-foreground focus:outline-none focus:bg-accent/50 rounded px-1 py-0.5"
                          placeholder="..."
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          onClick={() => removeRedirect(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      {(originalUrl || newUrl || redirects.length > 0) && (
        <div className="flex justify-end gap-2">
          <Button onClick={savePlan} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {activePlanId ? "Update Plan" : "Save Plan"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Crawled pages summary (collapsible) */}
      {(originalPages.length > 0 || newPages.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {originalPages.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Original Site Pages ({originalPages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {originalPages.map((p, i) => (
                    <div key={i} className="text-xs truncate text-muted-foreground">
                      <span className="font-mono">{(() => { try { return new URL(p.url).pathname; } catch { return p.url; } })()}</span>
                      {p.title && <span className="ml-1.5">— {p.title}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {newPages.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">New Site Pages ({newPages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {newPages.map((p, i) => (
                    <div key={i} className="text-xs truncate text-muted-foreground">
                      <span className="font-mono">{(() => { try { return new URL(p.url).pathname; } catch { return p.url; } })()}</span>
                      {p.title && <span className="ml-1.5">— {p.title}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
