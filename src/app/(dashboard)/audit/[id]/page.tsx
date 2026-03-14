import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getAuditById } from "@/lib/mock-data";

interface MetricRow {
  label: string;
  valueBefore: string | number | null | undefined;
  valueAfter: string | number | null | undefined;
  unit?: string;
  description: string;
}

function ScoreCircle({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const color = score >= 90 ? "text-green-600" : score >= 50 ? "text-orange-500" : "text-red-600";
  const bg = score >= 90 ? "bg-green-50" : score >= 50 ? "bg-orange-50" : "bg-red-50";
  const dim = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  return (
    <div className={`${dim} ${bg} ${color} rounded-full flex items-center justify-center font-bold`}>
      {score}
    </div>
  );
}

function MetricRowDisplay({ metric }: { metric: MetricRow }) {
  const before = metric.valueBefore ?? "—";
  const after = metric.valueAfter ?? "—";
  const unit = metric.unit || "";

  return (
    <div className="border-b last:border-0 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{metric.label}</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-red-600 font-mono">{before}{unit}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-green-600 font-mono">{after}{unit}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{metric.description}</p>
    </div>
  );
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = getAuditById(id);

  if (!audit) notFound();

  const psBefore = audit.pagespeed_before;
  const psAfter = audit.pagespeed_after;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditAny = audit as any;
  const gtBefore = auditAny.gtmetrix_before ?? null;
  const gtAfter = auditAny.gtmetrix_after ?? null;

  // Helper to safely get extended metric values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNum = (obj: any, key: string): number | undefined => obj?.[key] ?? undefined;

  const pagespeedMetrics: MetricRow[] = [
    {
      label: "Performance Score",
      valueBefore: psBefore?.performanceScore,
      valueAfter: psAfter?.performanceScore,
      unit: "/100",
      description: "Overall performance score from Google Lighthouse. 90+ is good, 50-89 needs improvement, below 50 is poor.",
    },
    {
      label: "Accessibility Score",
      valueBefore: getNum(psBefore, "accessibilityScore"),
      valueAfter: getNum(psAfter, "accessibilityScore"),
      unit: "/100",
      description: "How accessible your site is for users with disabilities. Covers screen readers, keyboard navigation, colour contrast, and ARIA labels.",
    },
    {
      label: "Best Practices Score",
      valueBefore: getNum(psBefore, "bestPracticesScore"),
      valueAfter: getNum(psAfter, "bestPracticesScore"),
      unit: "/100",
      description: "Checks for HTTPS, no console errors, correct image aspect ratios, and modern web standards compliance.",
    },
    {
      label: "SEO Score",
      valueBefore: getNum(psBefore, "seoScore"),
      valueAfter: getNum(psAfter, "seoScore"),
      unit: "/100",
      description: "Search engine optimisation score. Checks meta tags, crawlability, structured data, mobile friendliness, and link text.",
    },
    {
      label: "First Contentful Paint (FCP)",
      valueBefore: getNum(psBefore, "firstContentfulPaint"),
      valueAfter: getNum(psAfter, "firstContentfulPaint"),
      unit: "ms",
      description: "Time until the first piece of content is rendered. Impacts perceived load speed — users see something happening quickly.",
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
      description: "Total time the main thread was blocked, preventing user input. Proxy for First Input Delay. Under 200ms is good.",
    },
    {
      label: "Speed Index",
      valueBefore: psBefore?.speedIndex,
      valueAfter: psAfter?.speedIndex,
      unit: "ms",
      description: "How quickly the visible area of the page is populated. Lower is better — measures overall visual progress.",
    },
    {
      label: "Time to First Byte (TTFB)",
      valueBefore: getNum(psBefore, "timeToFirstByte"),
      valueAfter: getNum(psAfter, "timeToFirstByte"),
      unit: "ms",
      description: "Time from request to the first byte of the response. Indicates server response speed. Under 200ms is ideal.",
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Audit Results">
        <Badge variant={audit.status === "complete" ? "default" : "secondary"}>
          {audit.status}
        </Badge>
      </PageHeader>

      {/* Score Overview */}
      {psBefore && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-600">Before</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{audit.current_url}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ScoreCircle score={psBefore.performanceScore} />
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {getNum(psBefore, "accessibilityScore") != null && (
                    <div className="text-center">
                      <ScoreCircle score={getNum(psBefore, "accessibilityScore")!} size="sm" />
                      <p className="text-[10px] text-muted-foreground mt-1">A11y</p>
                    </div>
                  )}
                  {getNum(psBefore, "bestPracticesScore") != null && (
                    <div className="text-center">
                      <ScoreCircle score={getNum(psBefore, "bestPracticesScore")!} size="sm" />
                      <p className="text-[10px] text-muted-foreground mt-1">Best Prac</p>
                    </div>
                  )}
                  {getNum(psBefore, "seoScore") != null && (
                    <div className="text-center">
                      <ScoreCircle score={getNum(psBefore, "seoScore")!} size="sm" />
                      <p className="text-[10px] text-muted-foreground mt-1">SEO</p>
                    </div>
                  )}
                </div>
              </div>
              {audit.status === "complete" && (
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1">
                    <FileDown className="h-3.5 w-3.5" />
                    PageSpeed PDF
                  </Button>
                  {gtBefore && (
                    <Button variant="outline" size="sm" className="gap-1.5 flex-1">
                      <FileDown className="h-3.5 w-3.5" />
                      GTmetrix PDF
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-green-600">After</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{audit.new_url}</p>
            </CardHeader>
            <CardContent>
              {psAfter ? (
                <>
                  <div className="flex items-center gap-4">
                    <ScoreCircle score={psAfter.performanceScore} />
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      {getNum(psAfter, "accessibilityScore") != null && (
                        <div className="text-center">
                          <ScoreCircle score={getNum(psAfter, "accessibilityScore")!} size="sm" />
                          <p className="text-[10px] text-muted-foreground mt-1">A11y</p>
                        </div>
                      )}
                      {getNum(psAfter, "bestPracticesScore") != null && (
                        <div className="text-center">
                          <ScoreCircle score={getNum(psAfter, "bestPracticesScore")!} size="sm" />
                          <p className="text-[10px] text-muted-foreground mt-1">Best Prac</p>
                        </div>
                      )}
                      {getNum(psAfter, "seoScore") != null && (
                        <div className="text-center">
                          <ScoreCircle score={getNum(psAfter, "seoScore")!} size="sm" />
                          <p className="text-[10px] text-muted-foreground mt-1">SEO</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {audit.status === "complete" && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1">
                        <FileDown className="h-3.5 w-3.5" />
                        PageSpeed PDF
                      </Button>
                      {gtAfter && (
                        <Button variant="outline" size="sm" className="gap-1.5 flex-1">
                          <FileDown className="h-3.5 w-3.5" />
                          GTmetrix PDF
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">Pending...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Google PageSpeed Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Google PageSpeed Insights — Detailed Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Each metric below shows the before (red) and after (green) values, with an explanation of why it matters for your site.
          </p>
        </CardHeader>
        <CardContent>
          {pagespeedMetrics.map((metric) => (
            <MetricRowDisplay key={metric.label} metric={metric} />
          ))}
        </CardContent>
      </Card>

      {/* GTmetrix Report */}
      {gtBefore && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              GTmetrix Report — Detailed Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              GTmetrix provides a holistic view of page performance including total page weight, number of requests, and overall grade.
            </p>
          </CardHeader>
          <CardContent>
            <MetricRowDisplay metric={{
              label: "GTmetrix Grade",
              valueBefore: gtBefore.grade as string,
              valueAfter: gtAfter?.grade as string | undefined,
              description: "Overall grade from A (best) to F (worst). Combines performance and structure scores.",
            }} />
            <MetricRowDisplay metric={{
              label: "Performance Score",
              valueBefore: gtBefore.performanceScore as number,
              valueAfter: gtAfter?.performanceScore as number | undefined,
              unit: "%",
              description: "How well the page performs based on key performance indicators like load time and interactivity.",
            }} />
            <MetricRowDisplay metric={{
              label: "Structure Score",
              valueBefore: gtBefore.structureScore as number,
              valueAfter: gtAfter?.structureScore as number | undefined,
              unit: "%",
              description: "How well-built the page is — covers code optimisation, caching, compression, and resource efficiency.",
            }} />
            <MetricRowDisplay metric={{
              label: "Fully Loaded Time",
              valueBefore: `${((gtBefore.fullyLoadedTime as number) / 1000).toFixed(1)}`,
              valueAfter: gtAfter ? `${((gtAfter.fullyLoadedTime as number) / 1000).toFixed(1)}` : undefined,
              unit: "s",
              description: "Total time to fully load all resources on the page. Includes images, scripts, fonts, and third-party assets.",
            }} />
            <MetricRowDisplay metric={{
              label: "Total Page Size",
              valueBefore: formatBytes(gtBefore.totalPageSize),
              valueAfter: gtAfter ? formatBytes(gtAfter.totalPageSize) : undefined,
              description: "Total download size of the page. Smaller pages load faster and use less mobile data. Under 1MB is ideal.",
            }} />
            <MetricRowDisplay metric={{
              label: "Total Requests",
              valueBefore: gtBefore.totalRequests as number,
              valueAfter: gtAfter?.totalRequests as number | undefined,
              description: "Number of HTTP requests the page makes. Each request adds latency. Under 30 is good, under 20 is excellent.",
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
