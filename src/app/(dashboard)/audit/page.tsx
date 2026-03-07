import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AuditFormWrapper } from "./audit-form-wrapper";
import Link from "next/link";

export default async function AuditPage() {
  const supabase = await createClient();

  const { data: audits } = await supabase
    .from("audits")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Audit"
        description="Compare website speeds before and after"
      />

      <AuditFormWrapper />

      {/* Previous Audits */}
      {(audits ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Audits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(audits ?? []).map((audit) => (
              <Link
                key={audit.id}
                href={`/audit/${audit.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{audit.current_url}</p>
                  <p className="text-xs text-muted-foreground">
                    vs {audit.new_url} &middot; {formatDate(audit.created_at)}
                  </p>
                </div>
                <Badge
                  variant={audit.status === "complete" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {audit.status}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
