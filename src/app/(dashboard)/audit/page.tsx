import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AuditFormWrapper } from "./audit-form-wrapper";
import { mockAudits } from "@/lib/mock-data";
import Link from "next/link";

export default function AuditPage() {
  const audits = mockAudits;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Audit"
        description="Compare website speeds before and after"
      />

      <AuditFormWrapper />

      {/* Previous Audits */}
      {audits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Audits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {audits.map((audit) => (
              <Link
                key={audit.id}
                href={`/audit/${audit.id}`}
                className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium break-all min-w-0">{audit.current_url}</p>
                  <Badge
                    variant={audit.status === "complete" ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {audit.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  vs {audit.new_url} &middot; {formatDate(audit.created_at)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
