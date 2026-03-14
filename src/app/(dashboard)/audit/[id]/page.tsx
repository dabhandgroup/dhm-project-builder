"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/copy-button";
import { FileDown, Share2, ArrowRight, TrendingUp, TrendingDown, Check, Link2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getAuditById } from "@/lib/mock-data";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { use } from "react";

interface MetricRow {
  label: string;
  valueBefore: string | number | null | undefined;
  valueAfter: string | number | null | undefined;
  unit?: string;
  description: string;
  lowerIsBetter?: boolean;
}

function ScoreCircle({ score, label, size = "lg" }: { score: number; label?: string; size?: "sm" | "lg" }) {
  const color = score >= 90 ? "text-green-600" : score >= 50 ? "text-orange-500" : "text-red-600";
  const ringColor = score >= 90 ? "ring-green-200" : score >= 50 ? "ring-orange-200" : "ring-red-200";
  const bg = score >= 90 ? "bg-green-50" : score >= 50 ? "bg-orange-50" : "bg-red-50";
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-12 w-12 text-base";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${dim} ${bg} ${color} ${ringColor} rounded-full flex items-center justify-center font-bold ring-4`}>
        {score}
      </div>
      {label && <p className="text-[11px] text-muted-foreground font-medium">{label}</p>}
    </div>
  );
}

function ImprovementBadge({ before, after, unit, lowerIsBetter = true }: { before: number; after: number; unit?: string; lowerIsBetter?: boolean }) {
  const diff = before - after;
  const improved = lowerIsBetter ? diff > 0 : diff < 0;
  const pct = before > 0 ? Math.abs(Math.round((diff / before) * 100)) : 0;

  if (pct === 0) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
      improved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      {improved ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct}% {improved ? "better" : "worse"}
    </span>
  );
}

function ComparisonRow({ metric }: { metric: MetricRow }) {
  const before = metric.valueBefore;
  const after = metric.valueAfter;
  const unit = metric.unit || "";
  const hasBoth = before != null && after != null;

  return (
    <div className="border-b last:border-0 py-3.5 px-1">
      <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
        <span className="text-sm font-semibold min-w-0">{metric.label}</span>
        {hasBoth && typeof before === "number" && typeof after === "number" && (
          <ImprovementBadge before={before} after={after} lowerIsBetter={metric.lowerIsBetter !== false} />
        )}
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 rounded-md bg-red-50 border border-red-100 px-3 py-1.5 text-center">
          <span className="text-sm font-mono font-semibold text-red-700">{before ?? "—"}{before != null ? unit : ""}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 rounded-md bg-green-50 border border-green-100 px-3 py-1.5 text-center">
          <span className="text-sm font-mono font-semibold text-green-700">{after ?? "Pending"}{after != null ? unit : ""}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{metric.description}</p>
    </div>
  );
}

export default function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const audit = getAuditById(id);
  const [shareLink, setShareLink] = useState("");

  if (!audit) notFound();

  const psBefore = audit.pagespeed_before;
  const psAfter = audit.pagespeed_after;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditAny = audit as any;
  const gtBefore = auditAny.gtmetrix_before ?? null;
  const gtAfter = auditAny.gtmetrix_after ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNum = (obj: any, key: string): number | undefined => obj?.[key] ?? undefined;

  function handleShare() {
    const url = `${window.location.origin}/audit/${id}/share`;
    setShareLink(url);
    navigator.clipboard.writeText(url);
    toast({ title: "Share link copied to clipboard" });
  }

  // Core performance metrics - focused on what matters for the comparison
  const pagespeedMetrics: MetricRow[] = [
    {
      label: "Performance Score",
      valueBefore: psBefore?.performanceScore,
      valueAfter: psAfter?.performanceScore,
      unit: "/100",
      description: "Overall performance score from Google Lighthouse. 90+ is good, 50-89 needs improvement, below 50 is poor.",
      lowerIsBetter: false,
    },
    {
      label: "Largest Contentful Paint (LCP)",
      valueBefore: psBefore?.largestContentfulPaint,
      valueAfter: psAfter?.largestContentfulPaint,
      unit: "ms",
      description: "Time until the largest visible element loads. Core Web Vital — Google uses this for ranking. Under 2500ms is good.",
    },
    {
      label: "Cumulative Layout Shift (CLS)",
      valueBefore: psBefore?.cumulativeLayoutShift,
      valueAfter: psAfter?.cumulativeLayoutShift,
      description: "Measures visual stability — how much the page layout shifts while loading. Core Web Vital. Under 0.1 is good.",
    },
    {
      label: "Total Blocking Time (TBT)",
      valueBefore: getNum(psBefore, "totalBlockingTime"),
      valueAfter: getNum(psAfter, "totalBlockingTime"),
      unit: "ms",
      description: "Total time the main thread was blocked, preventing user input. Under 200ms is good.",
    },
    {
      label: "First Contentful Paint (FCP)",
      valueBefore: getNum(psBefore, "firstContentfulPaint"),
      valueAfter: getNum(psAfter, "firstContentfulPaint"),
      unit: "ms",
      description: "Time until the first piece of content is rendered. Users see something happening quickly.",
    },
    {
      label: "Speed Index",
      valueBefore: psBefore?.speedIndex,
      valueAfter: psAfter?.speedIndex,
      unit: "ms",
      description: "How quickly the visible area of the page is populated. Lower is better.",
    },
    {
      label: "Time to First Byte (TTFB)",
      valueBefore: getNum(psBefore, "timeToFirstByte"),
      valueAfter: getNum(psAfter, "timeToFirstByte"),
      unit: "ms",
      description: "Time from request to the first byte of the response. Under 200ms is ideal.",
    },
    {
      label: "Time to Interactive (TTI)",
      valueBefore: getNum(psBefore, "timeToInteractive"),
      valueAfter: getNum(psAfter, "timeToInteractive"),
      unit: "ms",
      description: "Time until the page is fully interactive and responds to user input reliably. Under 3800ms is good.",
    },
  ];

  function formatBytes(bytes: unknown): string {
    const b = Number(bytes);
    if (!b) return "—";
    if (b >= 1000000) return `${(b / 1000000).toFixed(1)}MB`;
    return `${(b / 1000).toFixed(0)}KB`;
  }

  // Calculate overall improvement summary
  const perfBefore = psBefore?.performanceScore ?? 0;
  const perfAfter = psAfter?.performanceScore ?? 0;
  const perfImprovement = perfAfter - perfBefore;

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6 overflow-x-hidden">
      <PageHeader title="Audit Results">
        <div className="flex items-center gap-2">
          <Badge variant={audit.status === "complete" ? "default" : "secondary"}>
            {audit.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </PageHeader>

      {shareLink && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <code className="flex-1 text-xs sm:text-sm truncate min-w-0">{shareLink}</code>
          <CopyButton text={shareLink} label="Copy" />
        </div>
      )}

      {/* Score Overview — focused on performance scores */}
      {psBefore && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Before card */}
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-red-600">Old Website</CardTitle>
                <Badge variant="outline" className="text-red-600 border-red-200">Before</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate break-all">{audit.current_url}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-2">
                <ScoreCircle score={psBefore.performanceScore} label="Performance" />
              </div>
              {gtBefore && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">GTmetrix Grade</span>
                  <span className="font-bold text-red-600 text-lg">{gtBefore.grade as string}</span>
                </div>
              )}
              {audit.status === "complete" && (
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1">
                    <FileDown className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* After card */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-green-600">New Build</CardTitle>
                <Badge variant="outline" className="text-green-600 border-green-200">After</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate break-all">{audit.new_url}</p>
            </CardHeader>
            <CardContent>
              {psAfter ? (
                <>
                  <div className="flex items-center justify-center py-2">
                    <ScoreCircle score={psAfter.performanceScore} label="Performance" />
                  </div>
                  {gtAfter && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">GTmetrix Grade</span>
                      <span className="font-bold text-green-600 text-lg">{gtAfter.grade as string}</span>
                    </div>
                  )}
                  {audit.status === "complete" && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1">
                        <FileDown className="h-3.5 w-3.5" />
                        Download PDF
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <span className="text-lg">...</span>
                  </div>
                  <p className="text-sm">Audit in progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Improvement Summary */}
      {psAfter && perfImprovement > 0 && (
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-2.5">
                <Check className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Performance improved by {perfImprovement} points ({perfBefore} → {perfAfter})
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  The new website is significantly faster and better optimised than the old one.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            PageSpeed Insights — Side-by-Side Comparison
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Each metric shows the old site (red) vs new build (green), with improvement percentages.
          </p>
        </CardHeader>
        <CardContent>
          {pagespeedMetrics.map((metric) => (
            <ComparisonRow key={metric.label} metric={metric} />
          ))}
        </CardContent>
      </Card>

      {/* GTmetrix Report */}
      {gtBefore && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              GTmetrix — Side-by-Side Comparison
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Page weight, request count, and load times — proving the new build is leaner and faster.
            </p>
          </CardHeader>
          <CardContent>
            <ComparisonRow metric={{
              label: "GTmetrix Grade",
              valueBefore: gtBefore.grade as string,
              valueAfter: gtAfter?.grade as string | undefined,
              description: "Overall grade from A (best) to F (worst). Combines performance and structure scores.",
            }} />
            <ComparisonRow metric={{
              label: "Performance Score",
              valueBefore: gtBefore.performanceScore as number,
              valueAfter: gtAfter?.performanceScore as number | undefined,
              unit: "%",
              description: "How well the page performs based on key performance indicators.",
              lowerIsBetter: false,
            }} />
            <ComparisonRow metric={{
              label: "Fully Loaded Time",
              valueBefore: `${((gtBefore.fullyLoadedTime as number) / 1000).toFixed(1)}`,
              valueAfter: gtAfter ? `${((gtAfter.fullyLoadedTime as number) / 1000).toFixed(1)}` : undefined,
              unit: "s",
              description: "Total time to fully load all resources. Includes images, scripts, fonts, and third-party assets.",
            }} />
            <ComparisonRow metric={{
              label: "Total Page Size",
              valueBefore: formatBytes(gtBefore.totalPageSize),
              valueAfter: gtAfter ? formatBytes(gtAfter.totalPageSize) : undefined,
              description: "Total download size. Smaller pages load faster and use less mobile data. Under 1MB is ideal.",
            }} />
            <ComparisonRow metric={{
              label: "Total Requests",
              valueBefore: gtBefore.totalRequests as number,
              valueAfter: gtAfter?.totalRequests as number | undefined,
              description: "Number of HTTP requests. Each request adds latency. Under 30 is good, under 20 is excellent.",
            }} />
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Audit created {formatDate(audit.created_at)}
        {audit.completed_at && ` · Completed ${formatDate(audit.completed_at)}`}
      </p>
    </div>
  );
}
