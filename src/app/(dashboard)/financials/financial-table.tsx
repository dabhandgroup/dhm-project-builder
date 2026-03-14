"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import type { ProjectStatus } from "@/types/database";

interface FinancialTableProps {
  projects: {
    id: string;
    title: string;
    status: string;
    one_off_revenue: number;
    recurring_revenue: number;
    created_at: string;
    clientName: string | null;
  }[];
}

export function FinancialTable({ projects }: FinancialTableProps) {
  const totalOneOff = projects.reduce((s, p) => s + p.one_off_revenue, 0);
  const totalMRR = projects.reduce((s, p) => s + p.recurring_revenue, 0);

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.clientName || "No client"}</p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-medium tabular-nums">{formatCurrency(p.one_off_revenue)}</p>
              <p className="text-xs text-green-600 font-medium tabular-nums">{formatCurrency(p.recurring_revenue)}/mo</p>
            </div>
          </Link>
        ))}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 font-semibold text-sm">
          <span>Total</span>
          <div className="text-right">
            <span className="tabular-nums">{formatCurrency(totalOneOff)}</span>
            <span className="text-green-600 ml-3 tabular-nums">{formatCurrency(totalMRR)}/mo</span>
          </div>
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Project</th>
              <th className="px-3 py-2 text-left font-medium">Client</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">One-Off</th>
              <th className="px-3 py-2 text-right font-medium">MRR</th>
              <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {p.clientName || "—"}
                </td>
                <td className="px-3 py-2">
                  <ProjectStatusBadge status={p.status as ProjectStatus} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(p.one_off_revenue)}</td>
                <td className="px-3 py-2 text-right font-medium text-green-600 tabular-nums">
                  {formatCurrency(p.recurring_revenue)}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground hidden lg:table-cell">
                  {formatDate(p.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td className="px-3 py-2" colSpan={3}>Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(totalOneOff)}</td>
              <td className="px-3 py-2 text-right text-green-600 tabular-nums">{formatCurrency(totalMRR)}</td>
              <td className="hidden lg:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
