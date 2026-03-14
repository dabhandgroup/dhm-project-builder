"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { DollarSign, TrendingUp, BarChart3, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FinancialTable } from "./financial-table";
import { RevenueCharts } from "@/components/financials/revenue-charts";
import { CostsTable } from "@/components/financials/costs-table";
import { TargetsCard } from "@/components/financials/targets-card";
import { mockProjects, mockCosts, mockTargets, getClientName, currencies } from "@/lib/mock-data";
import type { CurrencyCode } from "@/types/project";

const dateRanges = [
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
  { label: "All Time", days: 9999 },
];

export default function FinancialsPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode | "ALL">("AUD");
  const [selectedRange, setSelectedRange] = useState(9999);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - selectedRange);

  // Filter projects by currency and date
  const filteredProjects = mockProjects.filter((p) => {
    if (selectedCurrency !== "ALL" && p.currency !== selectedCurrency) return false;
    if (new Date(p.created_at) < cutoffDate) return false;
    return true;
  });

  // Filter costs
  const filteredCosts = mockCosts.filter((c) => {
    if (selectedCurrency !== "ALL" && c.currency !== selectedCurrency) return false;
    if (new Date(c.date) < cutoffDate) return false;
    return true;
  });

  const totalOneOff = filteredProjects.reduce((s, p) => s + (p.one_off_revenue ?? 0), 0);
  const totalMRR = filteredProjects.reduce((s, p) => s + (p.recurring_revenue ?? 0), 0);
  const totalARR = totalMRR * 12;

  const monthlyCosts = filteredCosts.filter((c) => c.type === "monthly").reduce((s, c) => s + c.amount, 0);
  const oneOffCosts = filteredCosts.filter((c) => c.type === "one_off").reduce((s, c) => s + c.amount, 0);
  const totalCosts = monthlyCosts + oneOffCosts;
  const netMonthlyProfit = totalMRR - monthlyCosts;
  const netTotalProfit = totalOneOff + totalMRR - totalCosts;

  // Display currency (use first currency that matches or AUD default)
  const displayCurrency = selectedCurrency === "ALL" ? "AUD" : selectedCurrency;

  // Get target for selected currency
  const target = selectedCurrency !== "ALL"
    ? mockTargets.find((t) => t.currency === selectedCurrency)
    : null;

  const tableProjects = filteredProjects.map((p) => ({
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
    { month: "Mar", mrr: totalMRR, target: 1600 },
  ];

  const statusData = [
    { name: "Lead", value: filteredProjects.filter((p) => p.status === "lead").length, color: "#94a3b8" },
    { name: "Initial Draft", value: filteredProjects.filter((p) => p.status === "initial_draft").length, color: "#3b82f6" },
    { name: "Awaiting Feedback", value: filteredProjects.filter((p) => p.status === "awaiting_feedback").length, color: "#f59e0b" },
    { name: "Revisions", value: filteredProjects.filter((p) => p.status === "revisions").length, color: "#f97316" },
    { name: "Complete", value: filteredProjects.filter((p) => p.status === "complete").length, color: "#22c55e" },
  ];

  const clientRevMap = new Map<string, { oneOff: number; mrr: number }>();
  filteredProjects.forEach((p) => {
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

  const profitData = [
    { month: "Oct", revenue: 1598, costs: 74, profit: 1524 },
    { month: "Nov", revenue: 1597, costs: 155, profit: 1442 },
    { month: "Dec", revenue: 597, costs: 81, profit: 516 },
    { month: "Jan", revenue: 2346, costs: 296, profit: 2050 },
    { month: "Feb", revenue: 1045, costs: 49, profit: 996 },
    { month: "Mar", revenue: totalMRR, costs: monthlyCosts, profit: netMonthlyProfit },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financials"
        description="Business performance overview"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Currency tabs */}
        <div className="flex rounded-lg border bg-muted/40 p-1 gap-0.5 overflow-x-auto">
          {currencies.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCurrency(c.code)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                selectedCurrency === c.code ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w20/${c.flag.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/w40/${c.flag.toLowerCase()}.png 2x`}
                alt={`${c.label} flag`}
                className="h-3 w-4 object-cover rounded-[2px]"
              />
              {c.code}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedCurrency("ALL")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              selectedCurrency === "ALL" ? "bg-background shadow-sm" : "hover:bg-background/50"
            }`}
          >
            All
          </button>
        </div>

        {/* Date range */}
        <div className="w-36">
          <Select
            value={String(selectedRange)}
            onChange={(e) => setSelectedRange(Number(e.target.value))}
            options={dateRanges.map((r) => ({
              value: String(r.days),
              label: r.label,
            }))}
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One-Off Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOneOff, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-600" />
              <span className="text-red-600 font-medium">-{formatCurrency(oneOffCosts, displayCurrency)}</span> costs
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
              {formatCurrency(totalMRR, displayCurrency)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-600" />
              <span className="text-red-600 font-medium">-{formatCurrency(monthlyCosts, displayCurrency)}</span> monthly costs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Monthly Profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netMonthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netMonthlyProfit, displayCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(netMonthlyProfit * 12, displayCurrency)}/yr projected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netTotalProfit >= 0 ? "" : "text-red-600"}`}>
              {formatCurrency(netTotalProfit, displayCurrency)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              Revenue minus all costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Targets */}
      {target && (
        <TargetsCard
          target={target}
          currentMrr={totalMRR}
          currentOneOff={totalOneOff}
          currency={displayCurrency}
        />
      )}

      {/* Charts */}
      <RevenueCharts
        mrrData={mrrData}
        statusData={statusData}
        revenueByClient={revenueByClient}
        profitData={profitData}
      />

      {/* Costs */}
      <CostsTable
        costs={filteredCosts}
        currency={displayCurrency}
      />

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
