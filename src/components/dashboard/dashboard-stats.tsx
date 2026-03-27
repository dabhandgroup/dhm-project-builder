"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useCachedStats } from "@/hooks/use-cached-stats";
import { formatCurrency } from "@/lib/utils";
import { FolderKanban, DollarSign, Users, Gauge } from "lucide-react";

interface DashboardStatsData {
  totalProjects: number;
  inProgress: number;
  totalMRR: number;
  activeClients: number;
}

function StatCardShell({
  label,
  icon: Icon,
  href,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-colors group-hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Link>
  );
}

const fmtCurrency = (n: number) => formatCurrency(n);
const fmtNumber = (n: number) => String(n);

export function DashboardStats() {
  const [freshData, setFreshData] = useState<DashboardStatsData | null>(null);
  const { data } = useCachedStats<DashboardStatsData>("dashboard-stats", freshData);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((res) => res.json())
      .then((d) => setFreshData(d))
      .catch(() => {});
  }, []);

  const showSkeleton = !data;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
      <StatCardShell label="Total Projects" icon={FolderKanban} href="/projects">
        {showSkeleton ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold">
            <AnimatedNumber value={data.totalProjects} formatter={fmtNumber} />
          </div>
        )}
      </StatCardShell>
      <StatCardShell label="In Progress" icon={Gauge} href="/projects">
        {showSkeleton ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold">
            <AnimatedNumber value={data.inProgress} formatter={fmtNumber} />
          </div>
        )}
      </StatCardShell>
      <StatCardShell label="Monthly Revenue" icon={DollarSign} href="/financials">
        {showSkeleton ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold">
            <AnimatedNumber value={data.totalMRR} formatter={fmtCurrency} />
          </div>
        )}
      </StatCardShell>
      <StatCardShell label="Active Clients" icon={Users} href="/clients">
        {showSkeleton ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold">
            <AnimatedNumber value={data.activeClients} formatter={fmtNumber} />
          </div>
        )}
      </StatCardShell>
    </div>
  );
}
