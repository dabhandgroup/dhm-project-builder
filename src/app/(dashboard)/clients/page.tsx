import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Mail, Phone, FolderKanban } from "lucide-react";
import { getClientsWithStats } from "@/lib/queries/clients";

async function ClientsList() {
  const formattedClients = await getClientsWithStats();

  if (formattedClients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Clients are automatically created when you create a project. You can also add them manually."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {formattedClients.map((client) => (
          <Link key={client.id} href={`/clients/${client.id}`} className="block">
            <div className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{client.name}</h3>
                  {client.company && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                      {client.company}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {client.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                {client.total_mrr > 0 && (
                  <span className="font-medium text-green-600">
                    ${client.total_mrr}/mo
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FolderKanban className="h-3 w-3" />
                  {client.project_count}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function ClientsListLoading() {
  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ClientsPage() {
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

      <Suspense fallback={<ClientsListLoading />}>
        <ClientsList />
      </Suspense>
    </div>
  );
}
