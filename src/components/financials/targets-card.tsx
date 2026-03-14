"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TargetsCardProps {
  target: {
    label: string;
    monthlyMrrTarget: number;
    monthlyOneOffTarget: number;
    deadline?: string;
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
  const isComplete = current >= target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium">{label}</span>
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
          <span className="flex-1">Targets — {target.label}</span>
          <Link href="/financials/targets">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          </Link>
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
        {target.deadline && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Deadline: {new Date(target.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
