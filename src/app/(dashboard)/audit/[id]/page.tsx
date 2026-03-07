import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getAuditById } from "@/lib/mock-data";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = getAuditById(id);

  if (!audit) notFound();

  const pagespeedBefore = audit.pagespeed_before;
  const pagespeedAfter = audit.pagespeed_after;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Audit Results">
        <Badge variant={audit.status === "complete" ? "default" : "secondary"}>
          {audit.status}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Before */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Before</CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              {audit.current_url}
            </p>
          </CardHeader>
          <CardContent>
            {pagespeedBefore ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Performance</span>
                  <span className="font-bold">{pagespeedBefore.performanceScore ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>LCP</span>
                  <span>{pagespeedBefore.largestContentfulPaint ?? "—"}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>CLS</span>
                  <span>{pagespeedBefore.cumulativeLayoutShift ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed Index</span>
                  <span>{pagespeedBefore.speedIndex ?? "—"}ms</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pending...</p>
            )}
          </CardContent>
        </Card>

        {/* After */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-600">After</CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              {audit.new_url}
            </p>
          </CardHeader>
          <CardContent>
            {pagespeedAfter ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Performance</span>
                  <span className="font-bold">{pagespeedAfter.performanceScore ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>LCP</span>
                  <span>{pagespeedAfter.largestContentfulPaint ?? "—"}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>CLS</span>
                  <span>{pagespeedAfter.cumulativeLayoutShift ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed Index</span>
                  <span>{pagespeedAfter.speedIndex ?? "—"}ms</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pending...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Audit created {formatDate(audit.created_at)}
        {audit.completed_at && ` · Completed ${formatDate(audit.completed_at)}`}
      </p>
    </div>
  );
}
