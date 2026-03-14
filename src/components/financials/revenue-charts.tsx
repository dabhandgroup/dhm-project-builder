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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartsProps {
  mrrData: { month: string; mrr: number; target: number }[];
  statusData: { name: string; value: number; color: string }[];
  revenueByClient: { name: string; oneOff: number; mrr: number }[];
  profitData: { month: string; revenue: number; costs: number; profit: number }[];
}

export function RevenueCharts({
  mrrData,
  statusData,
  revenueByClient,
  profitData,
}: RevenueChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* MRR Growth Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">MRR Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid hsl(var(--border))" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`£${value}`]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#3b82f6"
                  fill="url(#targetGradient)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#22c55e"
                  fill="url(#mrrGradient)"
                  strokeWidth={2}
                  name="Actual MRR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue vs Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid hsl(var(--border))" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`£${value}`]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="costs" fill="#ef4444" radius={[4, 4, 0, 0]} name="Costs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projects by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Client */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Revenue by Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByClient} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid hsl(var(--border))" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`£${value}`]}
                />
                <Legend />
                <Bar dataKey="oneOff" fill="#3b82f6" radius={[0, 4, 4, 0]} name="One-Off" stackId="rev" />
                <Bar dataKey="mrr" fill="#22c55e" radius={[0, 4, 4, 0]} name="MRR" stackId="rev" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
