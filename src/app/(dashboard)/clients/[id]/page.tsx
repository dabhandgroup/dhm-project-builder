import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { projectStatuses } from "@/constants/project-statuses";
import { getClientById, getClientProjects } from "@/lib/mock-data";
import type { ProjectStatus } from "@/types/database";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getClientById(id);

  if (!client) notFound();

  const projects = getClientProjects(id);
  const totalMRR = projects.reduce((sum, p) => sum + (p.recurring_revenue ?? 0), 0);
  const totalOneOff = projects.reduce((sum, p) => sum + (p.one_off_revenue ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={client.name}>
        <Link href={`/projects/new?client=${encodeURIComponent(client.name)}`}>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projects ({projects.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                projects.map((p) => {
                  const config = projectStatuses[p.status as ProjectStatus];
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.domain_name || "No domain"} &middot; {formatDate(p.created_at)}
                        </p>
                      </div>
                      <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                        {config.label}
                      </Badge>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{client.address}</span>
                </div>
              )}
              {client.company && (
                <p className="text-muted-foreground">Company: {client.company}</p>
              )}
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">One-off Total</span>
                <span className="font-medium">{formatCurrency(totalOneOff)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Recurring</span>
                <span className="font-medium text-green-600">{formatCurrency(totalMRR)}/mo</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
