import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, BarChart3, FolderKanban, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FinancialTable } from "./financial-table";
import { RevenueCharts } from "@/components/financials/revenue-charts";
import { CostsTable } from "@/components/financials/costs-table";
import { mockProjects, getClientName } from "@/lib/mock-data";

export default function FinancialsPage() {
  const allProjects = mockProjects;
  const totalOneOff = allProjects.reduce((s, p) => s + (p.one_off_revenue ?? 0), 0);
  const totalMRR = allProjects.reduce((s, p) => s + (p.recurring_revenue ?? 0), 0);
  const totalARR = totalMRR * 12;
  const activeCount = allProjects.filter((p) => p.status !== "draft").length;
  const avgProjectValue = activeCount > 0 ? totalMRR / activeCount : 0;

  // Total costs (matches initial costs in CostsTable)
  const totalCosts = 525; // sum of initial mock costs
  const netProfit = totalOneOff + totalMRR - totalCosts;

  const tableProjects = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    one_off_revenue: p.one_off_revenue,
    recurring_revenue: p.recurring_revenue,
    created_at: p.created_at,
    clientName: getClientName(p.client_id),
  }));

  // MRR growth data (mock historical)
  const mrrData = [
    { month: "Sep", mrr: 199, target: 400 },
    { month: "Oct", mrr: 398, target: 600 },
    { month: "Nov", mrr: 597, target: 800 },
    { month: "Dec", mrr: 597, target: 1000 },
    { month: "Jan", mrr: 846, target: 1200 },
    { month: "Feb", mrr: 1045, target: 1400 },
    { month: "Mar", mrr: 1244, target: 1600 },
  ];

  // Revenue by status
  const statusData = [
    { name: "Draft", value: allProjects.filter((p) => p.status === "draft").length, color: "#94a3b8" },
    { name: "Initial Draft", value: allProjects.filter((p) => p.status === "initial_draft").length, color: "#f59e0b" },
    { name: "Revisions", value: allProjects.filter((p) => p.status === "revisions").length, color: "#3b82f6" },
    { name: "Complete", value: allProjects.filter((p) => p.status === "complete").length, color: "#22c55e" },
  ];

  // Revenue by client
  const clientRevMap = new Map<string, { oneOff: number; mrr: number }>();
  allProjects.forEach((p) => {
    const name = getClientName(p.client_id) || "Unknown";
    const existing = clientRevMap.get(name) || { oneOff: 0, mrr: 0 };
    clientRevMap.set(name, {
      oneOff: existing.oneOff + p.one_off_revenue,
      mrr: existing.mrr + p.recurring_revenue,
    });
  });
  const revenueByClient = Array.from(clientRevMap.entries())
    .map(([name, rev]) => ({ name, ...rev }))
    .sort((a, b) => (b.oneOff + b.mrr) - (a.oneOff + a.mrr));

  // Revenue vs costs by month (mock)
  const profitData = [
    { month: "Oct", revenue: 1598, costs: 74, profit: 1524 },
    { month: "Nov", revenue: 1597, costs: 155, profit: 1442 },
    { month: "Dec", revenue: 597, costs: 81, profit: 516 },
    { month: "Jan", revenue: 2346, costs: 296, profit: 2050 },
    { month: "Feb", revenue: 1045, costs: 49, profit: 996 },
    { month: "Mar", revenue: 1244, costs: 35, profit: 1209 },
  ];

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
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+£900</span> this month
            </p>
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
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+£199</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalARR)}</div>
            <p className="text-xs text-muted-foreground mt-1">projected yearly</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-600" />
              <span className="text-red-600 font-medium">-{formatCurrency(totalCosts)}</span> in costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <RevenueCharts
        mrrData={mrrData}
        statusData={statusData}
        revenueByClient={revenueByClient}
        profitData={profitData}
      />

      {/* Costs */}
      <CostsTable />

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
