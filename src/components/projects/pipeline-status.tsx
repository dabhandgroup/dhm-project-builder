"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  Globe,
  Github,
  Cpu,
  Search,
  Upload,
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

const deploySteps: StepDef[] = [
  { key: "pushing", label: "Pushing to GitHub", icon: <Upload className="h-4 w-4" /> },
  { key: "deploying", label: "Deploying", icon: <Rocket className="h-4 w-4" /> },
];

type StepStatus = "pending" | "scraping" | "generating" | "pushing" | "deploying" | "complete" | "failed" | "idle";

function getStepState(currentStep: StepStatus, stepKey: string, stepList: StepDef[]): "done" | "active" | "pending" | "failed" {
  const order = [...stepList.map((s) => s.key), "complete"];
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
    preview_url?: string;
    github_repo_url?: string;
    deploy_provider?: string;
    has_build_zip?: boolean;
  }>({ step: "idle", message: "" });
  const [starting, setStarting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Determine if we're in deploy mode (pushing/deploying steps)
  const isDeployMode = status.step === "pushing" || status.step === "deploying" ||
    (status.step === "complete" && !!status.preview_url);

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

  async function startDeploy() {
    setDeploying(true);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({ step: "failed", message: data.error || "Failed to start deploy" });
        setDeploying(false);
        return;
      }

      setStatus({ step: "pushing", message: "Pushing to GitHub..." });

      const poll = async () => {
        const step = await pollStatus();
        if (step && !["complete", "failed"].includes(step)) {
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 1000);
    } catch {
      setStatus({ step: "failed", message: "Failed to start deploy" });
    }
    setDeploying(false);
  }

  const isRunning = !["idle", "complete", "failed"].includes(status.step);
  const isComplete = status.step === "complete";
  const isFailed = status.step === "failed";
  const hasBuild = status.has_build_zip;

  // Determine which steps to show
  const activeSteps = isDeployMode ? [...buildSteps, ...deploySteps] : buildSteps;

  function renderSteps(stepsToRender: StepDef[]) {
    return stepsToRender.map((step) => {
      const state = getStepState(status.step, step.key, stepsToRender);
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
              {step.key === "deploying" && status.deploy_provider
                ? `Deploying to ${status.deploy_provider.charAt(0).toUpperCase() + status.deploy_provider.slice(1)}`
                : step.label}
            </span>
          </div>
        </div>
      );
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Site Generation Pipeline
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
                {renderSteps(activeSteps)}
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

              {/* Complete — downloads + optional deploy */}
              {isComplete && (
                <div className="space-y-3">
                  {/* External links (if deployed) */}
                  {status.preview_url && (
                    <a
                      href={status.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      {status.preview_url}
                    </a>
                  )}
                  {status.github_repo_url && (
                    <a
                      href={status.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      {status.github_repo_url}
                    </a>
                  )}

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

                  {/* Optional deploy button */}
                  {!status.preview_url && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Deploy to GitHub + Hosting</p>
                          <p className="text-xs text-muted-foreground">
                            Optionally push to GitHub and deploy to Vercel/Netlify
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startDeploy}
                          disabled={deploying}
                          className="gap-1.5 shrink-0"
                        >
                          {deploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Deploy
                        </Button>
                      </div>
                    </div>
                  )}
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
