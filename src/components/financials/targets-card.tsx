"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TargetsCardProps {
  target: {
    label: string;
    monthlyMrrTarget: number;
    monthlyOneOffTarget: number;
  };
  currentMrr: number;
  currentOneOff: number;
  currency: string;
}

function ProgressBar({ current, target, currency, label }: {
  current: number;
  target: number;
  currency: string;
  label: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  const isComplete = current >= target;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-xs sm:text-sm">{label}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isComplete ? "bg-green-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-orange-400" : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">{formatCurrency(current, currency)} / {formatCurrency(target, currency)}</span>
        <span className="font-medium tabular-nums">
          {isComplete ? (
            <span className="text-green-600">Done!</span>
          ) : (
            <span className="text-foreground">{pct.toFixed(0)}%</span>
          )}
        </span>
      </div>
    </div>
  );
}

export function TargetsCard({ target, currentMrr, currentOneOff, currency }: TargetsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Targets — {target.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-1">
          <ProgressBar
            current={currentMrr}
            target={target.monthlyMrrTarget}
            currency={currency}
            label="MRR"
          />
          <ProgressBar
            current={currentOneOff}
            target={target.monthlyOneOffTarget}
            currency={currency}
            label="One-Off"
          />
        </div>
      </CardContent>
    </Card>
  );
}
