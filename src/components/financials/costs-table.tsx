"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Cost {
  id: string;
  description: string;
  amount: number;
  date: string;
  project?: string;
}

const initialCosts: Cost[] = [
  { id: "cost-1", description: "Stock photography — Richardson Legal", amount: 45, date: "2025-10-05", project: "Richardson Legal — Full Rebuild" },
  { id: "cost-2", description: "Premium font license (Inter + Playfair)", amount: 29, date: "2025-10-10", project: "Richardson Legal — Full Rebuild" },
  { id: "cost-3", description: "Logo design — Thompson Plumbing", amount: 120, date: "2025-11-20", project: "Thompson Plumbing — New Website" },
  { id: "cost-4", description: "Orchids.app Pro subscription (monthly)", amount: 49, date: "2026-01-01" },
  { id: "cost-5", description: "Vercel Pro plan (monthly)", amount: 20, date: "2026-01-01" },
  { id: "cost-6", description: "Google Workspace — team emails", amount: 12, date: "2026-01-01" },
  { id: "cost-7", description: "GTmetrix Pro API access", amount: 15, date: "2026-01-15" },
  { id: "cost-8", description: "Professional photos — Manchester Dental", amount: 200, date: "2026-01-25", project: "Manchester Dental Care — New Website" },
  { id: "cost-9", description: "Checkatrade badge verification fee", amount: 35, date: "2025-11-22", project: "Thompson Plumbing — New Website" },
];

export function CostsTable() {
  const [costs, setCosts] = useState<Cost[]>(initialCosts);
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const totalCosts = costs.reduce((s, c) => s + c.amount, 0);

  function addCost() {
    if (!newDesc.trim() || !newAmount) return;
    const cost: Cost = {
      id: `cost-${Date.now()}`,
      description: newDesc,
      amount: parseFloat(newAmount),
      date: new Date().toISOString().split("T")[0],
    };
    setCosts([cost, ...costs]);
    setNewDesc("");
    setNewAmount("");
    setShowForm(false);
  }

  function removeCost(id: string) {
    setCosts(costs.filter((c) => c.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Costs & Expenses
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-red-600">
              Total: {formatCurrency(totalCosts)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cost
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
            <input
              type="text"
              placeholder="Description..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
            />
            <input
              type="number"
              placeholder="£ Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full sm:w-28 rounded-md border px-3 py-2 text-sm bg-background"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addCost}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Project</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Date</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {costs.map((cost) => (
                <tr key={cost.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">{cost.description}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    {cost.project ? (
                      <Badge variant="secondary" className="text-xs truncate max-w-[200px]">
                        {cost.project}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">General</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell">
                    {cost.date}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-red-600">
                    -{formatCurrency(cost.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeCost(cost.id)}
                      className="p-1 rounded text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
