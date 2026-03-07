import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, BarChart3, FolderKanban } from "lucide-react";
import { FinancialTable } from "./financial-table";

export default async function FinancialsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, status, one_off_revenue, recurring_revenue, created_at, clients(name)")
    .order("created_at", { ascending: false });

  const allProjects = projects ?? [];
  const totalOneOff = allProjects.reduce((s, p) => s + (p.one_off_revenue ?? 0), 0);
  const totalMRR = allProjects.reduce((s, p) => s + (p.recurring_revenue ?? 0), 0);
  const totalARR = totalMRR * 12;
  const activeCount = allProjects.filter((p) => p.status !== "draft").length;
  const avgProjectValue = activeCount > 0 ? totalMRR / activeCount : 0;

  const tableProjects = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    one_off_revenue: p.one_off_revenue,
    recurring_revenue: p.recurring_revenue,
    created_at: p.created_at,
    clientName: ((p.clients as { name: string }[])?.[0])?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financials"
        description="Business performance overview"
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total One-Off</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOneOff)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMRR)}
            </div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalARR)}</div>
            <p className="text-xs text-muted-foreground">projected yearly</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Project Value</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgProjectValue)}</div>
            <p className="text-xs text-muted-foreground">per month per project</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialTable projects={tableProjects} />
        </CardContent>
      </Card>
    </div>
  );
}
