"use client";

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
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RevenueChartsProps {
  mrrData: { month: string; mrr: number; target: number }[];
  statusData: { name: string; value: number; color: string }[];
  revenueByClient: { name: string; oneOff: number; mrr: number }[];
  profitData: { month: string; revenue: number; costs: number; profit: number }[];
}

const tooltipStyle = {
  borderRadius: "10px",
  fontSize: "12px",
  border: "none",
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  padding: "10px 14px",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
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

export function RevenueCharts({
  mrrData,
  statusData,
  revenueByClient,
  profitData,
}: RevenueChartsProps) {
  const totalProjects = statusData.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* MRR Growth Chart */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">MRR Growth</CardTitle>
              <CardDescription className="text-xs">Actual vs target monthly recurring revenue</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Actual</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400 opacity-60" />Target</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pr-4 pb-4">
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${v}`}
                  width={55}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue vs Costs</CardTitle>
          <CardDescription className="text-xs">Monthly breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pr-4 pb-4">
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${v}`}
                  width={55}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" maxBarSize={32} />
                <Bar dataKey="costs" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Costs" maxBarSize={32} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projects by Status - Custom donut */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Projects by Status</CardTitle>
          <CardDescription className="text-xs">{totalProjects} total projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] sm:h-[300px] flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
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
                  <Tooltip
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 pl-2">
              {statusData.filter((s) => s.value > 0).map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground flex-1 truncate">{entry.name}</span>
                  <span className="text-xs font-semibold tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Client */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenue by Client</CardTitle>
              <CardDescription className="text-xs">One-off and recurring revenue split</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />One-Off</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />MRR</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pr-4 pb-4">
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByClient} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  width={120}
                />
                <Tooltip content={<CustomTooltipContent />} />
                <Bar dataKey="oneOff" fill="#3b82f6" radius={[0, 6, 6, 0]} name="One-Off" stackId="rev" maxBarSize={24} />
                <Bar dataKey="mrr" fill="#10b981" radius={[0, 6, 6, 0]} name="MRR" stackId="rev" maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
