"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { SitePreview } from "@/components/projects/site-preview";

interface StepDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const buildSteps: StepDef[] = [
  { key: "scraping", label: "Scrape Existing Site", icon: <Search className="h-4 w-4" /> },
  { key: "generating", label: "Building Site", icon: <Cpu className="h-4 w-4" /> },
];

type StepStatus = "pending" | "scraping" | "generating" | "complete" | "failed" | "idle";

function getStepState(currentStep: StepStatus, stepKey: string): "done" | "active" | "pending" | "failed" {
  const order = [...buildSteps.map((s) => s.key), "complete"];
  const currentIdx = order.indexOf(currentStep);
  const stepIdx = order.indexOf(stepKey);

  if (currentStep === "failed") {
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "failed";
    return "pending";
  }

  if (currentStep === "complete") return "done";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export function PipelineStatus({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<{
    step: StepStatus;
    message: string;
    error?: string;
    has_build_zip?: boolean;
  }>({ step: "idle", message: "" });
  const [starting, setStarting] = useState(false);

  const previewUrl = `/preview/${projectId}`;

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        return data.step;
      }
    } catch {
      // Ignore polling errors
    }
    return "idle";
  }, [projectId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function poll() {
      const step = await pollStatus();
      if (step && !["idle", "complete", "failed"].includes(step)) {
        timer = setTimeout(poll, 2000);
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [pollStatus]);

  async function startPipeline() {
    setStarting(true);
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
        return;
      }

      setStatus({ step: "pending", message: "Starting pipeline..." });

      const poll = async () => {
        const step = await pollStatus();
        if (step && !["complete", "failed"].includes(step)) {
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 1000);
    } catch {
      setStatus({ step: "failed", message: "Failed to start pipeline" });
    }
    setStarting(false);
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
              {/* Step indicators */}
              <div className="space-y-2">
                {buildSteps.map((step) => {
                  const state = getStepState(status.step, step.key);
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className="shrink-0">
                        {state === "done" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {state === "active" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                        {state === "pending" && <div className="h-5 w-5 rounded-full border-2 border-muted" />}
                        {state === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {step.icon}
                        <span className={state === "active" ? "font-medium" : state === "pending" ? "text-muted-foreground" : ""}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download ZIP
                    </a>
                    <a
                      href={`/api/projects/download?projectId=${projectId}&type=crawl`}
                      download
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Crawled site files
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {status.step === "idle" && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Build Site&quot; to generate the website. You can preview it and download the ZIP to deploy manually.
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
