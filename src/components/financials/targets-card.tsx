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
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatCurrency(current, currency)} / {formatCurrency(target, currency)}
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isComplete ? "bg-green-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-orange-400" : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{pct.toFixed(0)}% achieved</span>
        {!isComplete && (
          <span className="font-medium text-foreground">
            {formatCurrency(remaining, currency)} to go
          </span>
        )}
        {isComplete && (
          <span className="font-medium text-green-600">Target reached!</span>
        )}
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
      <CardContent className="space-y-6">
        <ProgressBar
          current={currentMrr}
          target={target.monthlyMrrTarget}
          currency={currency}
          label="Monthly Recurring Revenue (MRR)"
        />
        <ProgressBar
          current={currentOneOff}
          target={target.monthlyOneOffTarget}
          currency={currency}
          label="One-Off Revenue"
        />
      </CardContent>
    </Card>
  );
}
