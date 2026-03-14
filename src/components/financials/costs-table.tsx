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
  type: "monthly" | "one_off";
  currency: string;
}

interface CostsTableProps {
  costs: Cost[];
  currency: string;
}

export function CostsTable({ costs: initialCosts, currency }: CostsTableProps) {
  const [costs, setCosts] = useState<Cost[]>(initialCosts);
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"monthly" | "one_off">("one_off");

  const monthlyCosts = costs.filter((c) => c.type === "monthly");
  const oneOffCosts = costs.filter((c) => c.type === "one_off");
  const totalMonthly = monthlyCosts.reduce((s, c) => s + c.amount, 0);
  const totalOneOff = oneOffCosts.reduce((s, c) => s + c.amount, 0);

  function addCost() {
    if (!newDesc.trim() || !newAmount) return;
    const cost: Cost = {
      id: `cost-${Date.now()}`,
      description: newDesc,
      amount: parseFloat(newAmount),
      date: new Date().toISOString().split("T")[0],
      type: newType,
      currency,
    };
    setCosts([cost, ...costs]);
    setNewDesc("");
    setNewAmount("");
    setShowForm(false);
  }

  function removeCost(id: string) {
    setCosts(costs.filter((c) => c.id !== id));
  }

  function CostSection({ title, items, total, color }: {
    title: string;
    items: Cost[];
    total: number;
    color: string;
  }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className={`text-sm font-semibold ${color}`}>
            {formatCurrency(total, currency)}/mo
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No costs recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {items.map((cost) => (
                  <tr key={cost.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 pr-3">{cost.description}</td>
                    <td className="py-2 px-2 hidden sm:table-cell">
                      {cost.project ? (
                        <Badge variant="secondary" className="text-xs truncate max-w-[200px]">
                          {cost.project}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">General</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground hidden md:table-cell">
                      {cost.date}
                    </td>
                    <td className="py-2 pl-2 text-right font-medium text-red-600 whitespace-nowrap">
                      -{formatCurrency(cost.amount, currency)}
                    </td>
                    <td className="py-2 pl-2 w-8">
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
        )}
      </div>
    );
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
              Total: {formatCurrency(totalMonthly + totalOneOff, currency)}
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
      <CardContent className="space-y-6">
        {showForm && (
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Description..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full sm:w-28 rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setNewType("one_off")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    newType === "one_off" ? "bg-background shadow-sm" : ""
                  }`}
                >
                  One-Off
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("monthly")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    newType === "monthly" ? "bg-background shadow-sm" : ""
                  }`}
                >
                  Monthly
                </button>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={addCost}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        <CostSection
          title="Monthly Recurring Costs"
          items={monthlyCosts}
          total={totalMonthly}
          color="text-red-600"
        />

        <CostSection
          title="One-Off Costs"
          items={oneOffCosts}
          total={totalOneOff}
          color="text-orange-600"
        />
      </CardContent>
    </Card>
  );
}
