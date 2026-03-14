"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { mockTargets, currencies } from "@/lib/mock-data";
import type { CurrencyCode } from "@/types/project";

interface TargetData {
  id: string;
  currency: CurrencyCode;
  label: string;
  monthlyMrrTarget: number;
  monthlyOneOffTarget: number;
  deadline: string;
}

export default function TargetsEditPage() {
  const [targets, setTargets] = useState<TargetData[]>(
    mockTargets.map((t) => ({
      ...t,
      deadline: "",
    }))
  );
  const [saving, setSaving] = useState(false);

  function updateTarget(id: string, field: keyof TargetData, value: string | number) {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function addTarget() {
    // Find currencies not yet used
    const usedCurrencies = new Set(targets.map((t) => t.currency));
    const available = currencies.find((c) => !usedCurrencies.has(c.code));
    if (!available) return;

    setTargets((prev) => [
      ...prev,
      {
        id: `target-${Date.now()}`,
        currency: available.code,
        label: available.label,
        monthlyMrrTarget: 0,
        monthlyOneOffTarget: 0,
        deadline: "",
      },
    ]);
  }

  function removeTarget(id: string) {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  }

  const currencyInfo = (code: CurrencyCode) =>
    currencies.find((c) => c.code === code);

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/financials">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Edit Targets</h1>
          <p className="text-xs text-muted-foreground">Set revenue goals and deadlines per currency</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {targets.map((target) => {
        const info = currencyInfo(target.currency);
        return (
          <Card key={target.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {info && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://flagcdn.com/w40/${info.flag.toLowerCase()}.png`}
                    alt={`${info.label} flag`}
                    className="h-4 w-6 object-cover rounded-[2px]"
                  />
                )}
                <span className="flex-1">{target.label} ({target.currency})</span>
                <button
                  type="button"
                  onClick={() => removeTarget(target.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly MRR Target</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {target.currency === "GBP" ? "£" : "$"}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={target.monthlyMrrTarget}
                      onChange={(e) => updateTarget(target.id, "monthlyMrrTarget", Number(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Recurring revenue you want to reach each month
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly One-Off Target</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {target.currency === "GBP" ? "£" : "$"}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={target.monthlyOneOffTarget}
                      onChange={(e) => updateTarget(target.id, "monthlyOneOffTarget", Number(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    One-off project revenue target per month
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Deadline</Label>
                <Input
                  type="date"
                  value={target.deadline}
                  onChange={(e) => updateTarget(target.id, "deadline", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  When do you want to hit these targets by?
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {targets.length < currencies.length && (
        <Button variant="outline" className="w-full" onClick={addTarget}>
          <Plus className="h-4 w-4" />
          Add Target for Another Currency
        </Button>
      )}
    </div>
  );
}
