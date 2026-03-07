import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Mail, Phone, FolderKanban } from "lucide-react";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(id, recurring_revenue)")
    .order("name");

  const formattedClients = (clients ?? []).map((c) => {
    const projects = (c.projects ?? []) as { id: string; recurring_revenue: number }[];
    return {
      ...c,
      projectCount: projects.length,
      totalMRR: projects.reduce((sum, p) => sum + (p.recurring_revenue ?? 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Manage your clients">
        <Link href="/clients?new=true">
          <Button>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </PageHeader>

      {formattedClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Clients are automatically created when you create a project. You can also add them manually."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {formattedClients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{client.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FolderKanban className="h-3 w-3" />
                      {client.projectCount}
                    </span>
                  </div>
                  {client.company && (
                    <p className="text-xs text-muted-foreground">{client.company}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {client.phone}
                      </span>
                    )}
                  </div>
                  {client.totalMRR > 0 && (
                    <p className="text-xs font-medium text-green-600">
                      ${client.totalMRR}/mo
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
