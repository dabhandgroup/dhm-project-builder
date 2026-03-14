"use client";

import { useState, use } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Sparkles,
  Check,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";
import { getContentPlanByProjectId, getProjectById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface MonthPlan {
  month: string;
  topic: string;
  keywords: string[];
  locations: string[];
  notes: string;
}

type ContentStatus = "not_started" | "generating" | "generated";

export default function ContentPlanDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const plan = getContentPlanByProjectId(projectId);

  if (!plan) notFound();

  const project = getProjectById(plan.project_id);
  const planData = (plan.plan_data as MonthPlan[]) ?? [];

  const [planApproved, setPlanApproved] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [monthIdeas, setMonthIdeas] = useState<Record<number, string[]>>({});
  const [newIdea, setNewIdea] = useState<Record<number, string>>({});
  const [contentStatus, setContentStatus] = useState<Record<number, ContentStatus>>({});

  function addIdea(monthIndex: number) {
    const idea = newIdea[monthIndex]?.trim();
    if (!idea) return;
    setMonthIdeas((prev) => ({
      ...prev,
      [monthIndex]: [...(prev[monthIndex] || []), idea],
    }));
    setNewIdea((prev) => ({ ...prev, [monthIndex]: "" }));
  }

  function removeIdea(monthIndex: number, ideaIndex: number) {
    setMonthIdeas((prev) => ({
      ...prev,
      [monthIndex]: prev[monthIndex]?.filter((_, i) => i !== ideaIndex) || [],
    }));
  }

  function handleGenerate(monthIndex: number) {
    setContentStatus((prev) => ({ ...prev, [monthIndex]: "generating" }));
    // Simulate AI generation
    setTimeout(() => {
      setContentStatus((prev) => ({ ...prev, [monthIndex]: "generated" }));
    }, 2000);
  }

  function getStatusBadge(monthIndex: number) {
    const status = contentStatus[monthIndex];
    if (status === "generating") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3 animate-spin" />
          Generating...
        </Badge>
      );
    }
    if (status === "generated") {
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Content Ready
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Content Plan"
        description={project?.title ?? ""}
      >
        <Button
          variant={planApproved ? "default" : "outline"}
          size="sm"
          onClick={() => setPlanApproved(!planApproved)}
          className={cn(planApproved && "bg-green-600 hover:bg-green-700")}
        >
          {planApproved ? (
            <>
              <Check className="h-4 w-4" />
              Plan Approved
            </>
          ) : (
            "Approve Plan"
          )}
        </Button>
      </PageHeader>

      {/* Two-phase explanation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={cn("border-l-4", planApproved ? "border-l-green-500" : "border-l-primary")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {planApproved ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-primary" />
              )}
              <p className="text-sm font-semibold">Phase 1: Content Plan</p>
            </div>
            <p className="text-xs text-muted-foreground">
              12-month content plan with topics, keywords, and ideas. {planApproved ? "Approved by client." : "Awaiting client approval."}
            </p>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", planApproved ? "border-l-primary" : "border-l-muted")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className={cn("h-4 w-4", planApproved ? "text-primary" : "text-muted-foreground")} />
              <p className={cn("text-sm font-semibold", !planApproved && "text-muted-foreground")}>Phase 2: Content Writing</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {planApproved
                ? "Generate and review content for each month."
                : "Available after the content plan is approved."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly cards */}
      {planData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No content plan data available.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planData.map((month, i) => {
            const isExpanded = expandedMonth === i;
            const ideas = monthIdeas[i] || [];
            const status = contentStatus[i];

            return (
              <Card
                key={i}
                className={cn(
                  "transition-shadow",
                  isExpanded && "sm:col-span-2 lg:col-span-3 shadow-md"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{month.month}</CardTitle>
                    <div className="flex items-center gap-2">
                      {planApproved && getStatusBadge(i)}
                      <button
                        type="button"
                        onClick={() => setExpandedMonth(isExpanded ? null : i)}
                        className="p-1 rounded hover:bg-accent transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="font-medium text-sm">{month.topic}</p>

                  {month.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {month.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded bg-secondary px-1.5 py-0.5 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {month.notes && (
                    <p className="text-muted-foreground">{month.notes}</p>
                  )}

                  {/* Ideas section */}
                  {ideas.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t">
                      <p className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                        <Lightbulb className="h-3 w-3" />
                        Ideas
                      </p>
                      {ideas.map((idea, j) => (
                        <div key={j} className="flex items-start gap-1.5 group">
                          <span className="text-xs text-muted-foreground mt-0.5">•</span>
                          <span className="flex-1 text-xs">{idea}</span>
                          <button
                            type="button"
                            onClick={() => removeIdea(i, j)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t">
                      {/* Add idea input */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Add an idea for this month
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newIdea[i] || ""}
                            onChange={(e) =>
                              setNewIdea((prev) => ({ ...prev, [i]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addIdea(i);
                              }
                            }}
                            placeholder="e.g. Include case study about..."
                            className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addIdea(i)}
                            className="h-7 px-2 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Locations */}
                      {month.locations?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Target Locations
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {month.locations.map((loc) => (
                              <span
                                key={loc}
                                className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 text-xs"
                              >
                                {loc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Generate & View buttons (only when plan approved) */}
                      {planApproved && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleGenerate(i)}
                            disabled={status === "generating"}
                            className="text-xs h-8"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {status === "generating"
                              ? "Generating..."
                              : status === "generated"
                                ? "Regenerate"
                                : "Generate Content"}
                          </Button>

                          {status === "generated" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Word Doc
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
