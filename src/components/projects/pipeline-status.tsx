"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/copy-button";
import {
  Loader2,
  Play,
  CheckCircle2,
  Globe,
  Cpu,
  Search,
  Rocket,
  Download,
  Code,
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
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pollStatus]);

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
              {/* Overall progress bar */}
              {isRunning && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">Building...</span>
                    <span>{Math.round(((status.completed_substeps?.length ?? 0) / buildSubsteps.length) * 100)}%</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    {/* Completed portion */}
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${((status.completed_substeps?.length ?? 0) / buildSubsteps.length) * 100}%` }}
                    />
                    {/* Animated shimmer on top */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(((status.completed_substeps?.length ?? 0) + 1) / buildSubsteps.length * 100, 100)}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>
              )}

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
                      <div
                        key={substep.key}
                        className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                          state === "active" ? "bg-blue-50 dark:bg-blue-950/30 -mx-2 px-2 py-1 rounded-md" : ""
                        }`}
                      >
                        <div className="shrink-0">
                          {state === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {state === "active" && (
                            <div className="relative">
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                              <div className="absolute inset-0 h-4 w-4 rounded-full bg-blue-400/20 animate-ping" />
                            </div>
                          )}
                          {state === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                        </div>
                        <span className={state === "done" ? "text-foreground" : state === "active" ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {substep.icon}
                        </span>
                        <span className={state === "done" ? "text-foreground" : state === "active" ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {substep.label}
                        </span>
                        {state === "active" && (
                          <span className="ml-auto text-[10px] text-blue-500 animate-pulse">In progress</span>
                        )}
                        {state === "done" && (
                          <CheckCircle2 className="ml-auto h-3 w-3 text-green-400" />
                        )}
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
              Click &quot;Build Site&quot; to generate the website with AI.
              {isRebuild && " The existing site will be crawled first to preserve content and structure."}
              {" "}You can preview it and download the ZIP to deploy manually.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Site Preview (shown when build is complete) */}
      {isComplete && hasBuild && (
        <SitePreview projectId={projectId} />
      )}
    </div>
  );
}
