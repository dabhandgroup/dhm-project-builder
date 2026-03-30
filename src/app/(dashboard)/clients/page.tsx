import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Phone, FolderKanban, ChevronRight } from "lucide-react";
import { getClientsWithStats } from "@/lib/queries/clients";
import { formatCurrency } from "@/lib/utils";
import { AddClientDialog } from "@/components/clients/add-client-dialog";

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
        {formattedClients.map((client, i) => (
          <Link key={client.id} href={`/clients/${client.id}`} className="block">
            <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer">
              {/* Avatar */}
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  avatarColors[i % avatarColors.length]
                }`}
              >
                {getInitials(client.name)}
              </div>

              {/* Name & contact */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold text-sm truncate">{client.name}</h3>
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

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0 text-xs">
                {client.total_mrr > 0 && (
                  <span className="font-semibold text-green-600">
                    {formatCurrency(client.total_mrr, client.currency)}/mo
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground rounded-full bg-muted px-2 py-0.5">
                  <FolderKanban className="h-3 w-3" />
                  {client.project_count}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
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
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
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
        <AddClientDialog />
      </PageHeader>

      <Suspense fallback={<ClientsListLoading />}>
        <ClientsList />
      </Suspense>
    </div>
  );
}
