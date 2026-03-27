"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { DollarSign, TrendingUp, BarChart3, Target, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { FinancialTable } from "./financial-table";
import { RevenueCharts } from "@/components/financials/revenue-charts";
import { CostsTable } from "@/components/financials/costs-table";
import { TargetsCard } from "@/components/financials/targets-card";
import { currencies } from "@/constants/currencies";
import type { CurrencyCode } from "@/types/project";

interface FinancialProject {
  id: string;
  title: string;
  one_off_revenue: number;
  recurring_revenue: number;
  include_in_financials: boolean;
  currency: string;
  status: string;
  clients: { name: string } | null;
  created_at: string;
}

interface FinancialCost {
  id: string;
  description: string;
  amount: number;
  currency: string;
  type: "one_off" | "monthly";
  date: string;
  projects: { title: string } | null;
}

interface FinancialTarget {
  id: string;
  currency: string;
  monthly_mrr_target: number;
  monthly_one_off_target: number;
  label: string | null;
}

interface FinancialData {
  totalMRR: number;
  totalOneOff: number;
  monthlyCosts: number;
  oneOffCosts: number;
  netProfit: number;
  totalProfit: number;
  projects: FinancialProject[];
  costs: FinancialCost[];
  targets: FinancialTarget[];
}

const dateRanges = [
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
  { label: "All Time", days: 9999 },
];

function NumberSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`h-7 w-20 ${className ?? ""}`} />;
}

function SmallSkeleton() {
  return <Skeleton className="h-3.5 w-24 mt-1" />;
}

export function FinancialsClient({ initialData }: { initialData?: FinancialData }) {
  const [data, setData] = useState<FinancialData | null>(initialData ?? null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode | "ALL">("AUD");
  const [selectedRange, setSelectedRange] = useState(9999);

  // Fetch data client-side if not provided via props
  useEffect(() => {
    if (initialData) return;
    fetch("/api/financials")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [initialData]);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - selectedRange);

  // Filter projects by currency, date, and financials inclusion
  const filteredProjects = (data?.projects ?? []).filter((p) => {
    if (!p.include_in_financials) return false;
    if (selectedCurrency !== "ALL" && p.currency !== selectedCurrency) return false;
    if (new Date(p.created_at) < cutoffDate) return false;
    return true;
  });

  // Filter costs
  const filteredCosts = (data?.costs ?? []).filter((c) => {
    if (selectedCurrency !== "ALL" && c.currency !== selectedCurrency) return false;
    if (new Date(c.date) < cutoffDate) return false;
    return true;
  });

  const totalOneOff = filteredProjects.reduce((s, p) => s + Number(p.one_off_revenue ?? 0), 0);
  const totalMRR = filteredProjects.reduce((s, p) => s + Number(p.recurring_revenue ?? 0), 0);

  const monthlyCosts = filteredCosts.filter((c) => c.type === "monthly").reduce((s, c) => s + Number(c.amount), 0);
  const oneOffCosts = filteredCosts.filter((c) => c.type === "one_off").reduce((s, c) => s + Number(c.amount), 0);
  const netMonthlyProfit = totalMRR - monthlyCosts;
  const netTotalProfit = totalOneOff + totalMRR - monthlyCosts - oneOffCosts;

  const displayCurrency = selectedCurrency === "ALL" ? "AUD" : selectedCurrency;

  const target = data && selectedCurrency !== "ALL"
    ? data.targets.find((t) => t.currency === selectedCurrency)
    : null;

  const tableProjects = filteredProjects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    one_off_revenue: Number(p.one_off_revenue),
    recurring_revenue: Number(p.recurring_revenue),
    created_at: p.created_at,
    clientName: p.clients?.name ?? "",
  }));

  const statusData = [
    { name: "Lead", value: filteredProjects.filter((p) => p.status === "lead").length, color: "#94a3b8" },
    { name: "Initial Draft", value: filteredProjects.filter((p) => p.status === "initial_draft").length, color: "#3b82f6" },
    { name: "Awaiting Feedback", value: filteredProjects.filter((p) => p.status === "awaiting_feedback").length, color: "#f59e0b" },
    { name: "Revisions", value: filteredProjects.filter((p) => p.status === "revisions").length, color: "#f97316" },
    { name: "Complete", value: filteredProjects.filter((p) => p.status === "complete").length, color: "#22c55e" },
  ];

  const clientRevMap = new Map<string, { oneOff: number; mrr: number }>();
  filteredProjects.forEach((p) => {
    const name = p.clients?.name || "Unknown";
    const existing = clientRevMap.get(name) || { oneOff: 0, mrr: 0 };
    clientRevMap.set(name, {
      oneOff: existing.oneOff + Number(p.one_off_revenue),
      mrr: existing.mrr + Number(p.recurring_revenue),
    });
  });
  const revenueByClient = Array.from(clientRevMap.entries())
    .map(([name, rev]) => ({ name, ...rev }))
    .sort((a, b) => (b.oneOff + b.mrr) - (a.oneOff + a.mrr));

  const mrrData = [{ month: "Current", mrr: totalMRR, target: target?.monthly_mrr_target ?? 0 }];
  const profitData = [{ month: "Current", revenue: totalMRR + totalOneOff, costs: monthlyCosts + oneOffCosts, profit: netTotalProfit }];

  const formattedTarget = target ? {
    id: target.id,
    currency: target.currency as CurrencyCode,
    label: target.label ?? target.currency,
    monthlyMrrTarget: target.monthly_mrr_target,
    monthlyOneOffTarget: target.monthly_one_off_target,
  } : null;

  const loading = !data;

  return (
    <div className="space-y-6">
      <PageHeader title="Financials">
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
      </PageHeader>

      {/* Currency tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg border bg-muted/40 p-1 gap-0.5 overflow-x-auto">
          {currencies.map((c) => (
            <button
              key={c.code}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); setSelectedCurrency(c.code); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 select-none ${
                selectedCurrency === c.code ? "bg-background shadow-sm" : "active:bg-background/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w20/${c.flag.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/w40/${c.flag.toLowerCase()}.png 2x`}
                alt={`${c.label} flag`}
                className="h-3 w-4 object-cover rounded-[2px] pointer-events-none"
              />
              <span className="pointer-events-none">{c.code}</span>
            </button>
          ))}
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setSelectedCurrency("ALL"); }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 select-none ${
              selectedCurrency === "ALL" ? "bg-background shadow-sm" : "active:bg-background/50"
            }`}
          >
            <span className="pointer-events-none">All</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — shells render instantly, only numbers load */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">One-Off</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <NumberSkeleton /> : (
              <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalOneOff, displayCurrency)}</div>
            )}
            {loading ? <SmallSkeleton /> : (
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3 text-red-600 shrink-0" />
                <span className="text-red-600 font-medium">-{formatCurrency(oneOffCosts, displayCurrency)}</span> <span className="hidden sm:inline">costs</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1">
              <span className="sm:hidden">MRR</span>
              <span className="hidden sm:inline">Monthly Revenue</span>
              <button type="button" className="sm:hidden text-muted-foreground" title="Monthly Recurring Revenue">
                <Info className="h-3 w-3" />
              </button>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <NumberSkeleton /> : (
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {formatCurrency(totalMRR, displayCurrency)}
              </div>
            )}
            {loading ? <SmallSkeleton /> : (
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3 text-red-600 shrink-0" />
                <span className="text-red-600 font-medium">-{formatCurrency(monthlyCosts, displayCurrency)}</span> <span className="hidden sm:inline">monthly costs</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              <span className="sm:hidden">Net Profit</span>
              <span className="hidden sm:inline">Net Monthly Profit</span>
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <NumberSkeleton /> : (
              <div className={`text-lg sm:text-2xl font-bold ${netMonthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netMonthlyProfit, displayCurrency)}
              </div>
            )}
            {loading ? <SmallSkeleton /> : (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                {formatCurrency(netMonthlyProfit * 12, displayCurrency)}/yr
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <NumberSkeleton /> : (
              <div className={`text-lg sm:text-2xl font-bold ${netTotalProfit >= 0 ? "" : "text-red-600"}`}>
                {formatCurrency(netTotalProfit, displayCurrency)}
              </div>
            )}
            {loading ? <SmallSkeleton /> : (
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 shrink-0" />
                <span className="hidden sm:inline">Revenue minus all costs</span>
                <span className="sm:hidden">All revenue - costs</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Everything below here loads after data arrives */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Targets */}
          {formattedTarget && (
            <TargetsCard
              target={formattedTarget}
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
            costs={filteredCosts.map((c) => ({
              id: c.id,
              description: c.description,
              amount: c.amount,
              currency: c.currency,
              type: c.type,
              date: c.date,
              project: c.projects?.title,
            }))}
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
        </>
      )}
    </div>
  );
}
