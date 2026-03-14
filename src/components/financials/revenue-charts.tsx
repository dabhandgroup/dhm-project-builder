"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RevenueChartsProps {
  mrrData: { month: string; mrr: number; target: number }[];
  statusData: { name: string; value: number; color: string }[];
  revenueByClient: { name: string; oneOff: number; mrr: number }[];
  profitData: { month: string; revenue: number; costs: number; profit: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 backdrop-blur-sm shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, idx: number) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold ml-auto tabular-nums">${entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function RevenueCharts({
  mrrData,
  statusData,
  revenueByClient,
  profitData,
}: RevenueChartsProps) {
  const totalProjects = statusData.reduce((sum, s) => sum + s.value, 0);
  const isMobile = useIsMobile();
  const yAxisWidth = isMobile ? 40 : 55;
  const tickFontSize = isMobile ? 10 : 11;
  const yTickFormatter = isMobile ? (v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` : (v: number) => `$${v}`;

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      {/* MRR Growth Chart */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base">MRR Growth</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">Actual vs target</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Actual</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 opacity-60" />Target</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pr-2 sm:pr-4 pb-3">
          <div className="h-[220px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={yTickFormatter}
                  width={yAxisWidth}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#60a5fa"
                  fill="url(#targetGradient)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  name="Target"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#10b981"
                  fill="url(#mrrGradient)"
                  strokeWidth={2.5}
                  name="Actual MRR"
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue vs Costs */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm sm:text-base">Revenue vs Costs</CardTitle>
          <CardDescription className="text-[11px] sm:text-xs">Monthly breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pr-2 sm:pr-4 pb-3">
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={yTickFormatter}
                  width={yAxisWidth}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" maxBarSize={isMobile ? 22 : 32} />
                <Bar dataKey="costs" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Costs" maxBarSize={isMobile ? 22 : 32} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projects by Status - Custom donut */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm sm:text-base">Projects by Status</CardTitle>
          <CardDescription className="text-[11px] sm:text-xs">{totalProjects} total projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[280px] flex items-center">
            <div className="w-2/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-3/5 space-y-1.5 pl-3">
              {statusData.filter((s) => s.value > 0).map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[11px] sm:text-xs text-muted-foreground flex-1 truncate">{entry.name}</span>
                  <span className="text-[11px] sm:text-xs font-semibold tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Client */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base">Revenue by Client</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">One-off and recurring split</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />One-Off</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />MRR</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pr-2 sm:pr-4 pb-3">
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByClient} layout="vertical" margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: tickFontSize, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={yTickFormatter}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 9 : 11, fill: "hsl(var(--muted-foreground))" }}
                  width={isMobile ? 70 : 120}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Bar dataKey="oneOff" fill="#3b82f6" radius={[0, 4, 4, 0]} name="One-Off" stackId="rev" maxBarSize={isMobile ? 18 : 24} />
                <Bar dataKey="mrr" fill="#10b981" radius={[0, 4, 4, 0]} name="MRR" stackId="rev" maxBarSize={isMobile ? 18 : 24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
