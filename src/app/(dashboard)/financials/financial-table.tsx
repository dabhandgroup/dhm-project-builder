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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Project</th>
            <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Client</th>
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
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                {p.clientName || "—"}
              </td>
              <td className="px-3 py-2">
                <ProjectStatusBadge status={p.status as ProjectStatus} />
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(p.one_off_revenue)}</td>
              <td className="px-3 py-2 text-right font-medium text-green-600">
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
            <td className="px-3 py-2 text-right">{formatCurrency(totalOneOff)}</td>
            <td className="px-3 py-2 text-right text-green-600">{formatCurrency(totalMRR)}</td>
            <td className="hidden lg:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
