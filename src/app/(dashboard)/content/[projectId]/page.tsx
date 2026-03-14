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
  ChevronRight,
  CheckCircle2,
  Clock,
  Lightbulb,
  Trash2,
  CheckCheck,
  Pencil,
} from "lucide-react";
import { getContentPlanByProjectId, getProjectById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface MonthPlan {
  month: string;
  topic: string;
  keywords: string[];
  locations: string[];
  notes: string;
  blogTitles?: string[];
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

  const [approvedMonths, setApprovedMonths] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([0]));
  const [blogTitles, setBlogTitles] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};
    planData.forEach((m, i) => {
      initial[i] = m.blogTitles ? [...m.blogTitles] : [];
    });
    return initial;
  });
  const [newTitle, setNewTitle] = useState<Record<number, string>>({});
  const [contentStatus, setContentStatus] = useState<Record<number, ContentStatus>>({});

  const allApproved = approvedMonths.size === planData.length;

  function toggleMonth(idx: number) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function approveMonth(idx: number) {
    setApprovedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function approveAll() {
    if (allApproved) {
      setApprovedMonths(new Set());
    } else {
      setApprovedMonths(new Set(planData.map((_, i) => i)));
    }
  }

  function addTitle(monthIndex: number) {
    const title = newTitle[monthIndex]?.trim();
    if (!title) return;
    setBlogTitles((prev) => ({
      ...prev,
      [monthIndex]: [...(prev[monthIndex] || []), title],
    }));
    setNewTitle((prev) => ({ ...prev, [monthIndex]: "" }));
  }

  function removeTitle(monthIndex: number, titleIndex: number) {
    setBlogTitles((prev) => ({
      ...prev,
      [monthIndex]: prev[monthIndex]?.filter((_, i) => i !== titleIndex) || [],
    }));
  }

  function handleGenerate(monthIndex: number) {
    setContentStatus((prev) => ({ ...prev, [monthIndex]: "generating" }));
    setTimeout(() => {
      setContentStatus((prev) => ({ ...prev, [monthIndex]: "generated" }));
    }, 2000);
  }

  function handleGenerateAll() {
    approvedMonths.forEach((idx) => {
      if (contentStatus[idx] !== "generated") {
        setContentStatus((prev) => ({ ...prev, [idx]: "generating" }));
        setTimeout(() => {
          setContentStatus((prev) => ({ ...prev, [idx]: "generated" }));
        }, 2000 + idx * 500);
      }
    });
  }

  const approvedCount = approvedMonths.size;
  const generatedCount = Object.values(contentStatus).filter((s) => s === "generated").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Plan"
        description={project?.title ?? ""}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={approveAll}
            className={cn(allApproved && "border-green-600 text-green-600")}
          >
            {allApproved ? (
              <>
                <CheckCheck className="h-4 w-4" />
                All Approved
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4" />
                Approve All
              </>
            )}
          </Button>
        </div>
      </PageHeader>

      {/* Phase cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={cn("border-l-4", approvedCount > 0 ? "border-l-green-500" : "border-l-primary")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {approvedCount === 12 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Pencil className="h-4 w-4 text-primary" />
              )}
              <p className="text-sm font-semibold">Content Plan</p>
              <Badge variant="secondary" className="ml-auto text-xs">
                {approvedCount}/12 approved
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Review blog post titles for each month. Add, remove, or edit titles before approving.
            </p>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", approvedCount > 0 ? "border-l-primary" : "border-l-muted")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className={cn("h-4 w-4", approvedCount > 0 ? "text-primary" : "text-muted-foreground")} />
              <p className={cn("text-sm font-semibold", approvedCount === 0 && "text-muted-foreground")}>Written Content</p>
              <Badge variant="secondary" className="ml-auto text-xs">
                {generatedCount}/12 written
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedCount > 0 ? (
                <>
                  Generate blog posts for approved months.
                  {approvedCount > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 ml-1 text-xs"
                      onClick={handleGenerateAll}
                    >
                      Write all approved
                    </Button>
                  )}
                </>
              ) : (
                "Approve at least one month to start generating content."
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly list */}
      <div className="space-y-2">
        {planData.map((month, i) => {
          const isExpanded = expandedMonths.has(i);
          const isApproved = approvedMonths.has(i);
          const titles = blogTitles[i] || [];
          const status = contentStatus[i];

          return (
            <Card key={i} className={cn(isApproved && "border-green-200 dark:border-green-900")}>
              {/* Month header row */}
              <button
                type="button"
                onClick={() => toggleMonth(i)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{month.month}</span>
                    <span className="text-sm text-muted-foreground hidden sm:inline">—</span>
                    <span className="text-sm text-muted-foreground truncate hidden sm:inline">{month.topic}</span>
                  </div>
                  <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{month.topic}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {titles.length} blog {titles.length === 1 ? "title" : "titles"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isApproved && status === "generated" && (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600 text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Written
                    </Badge>
                  )}
                  {isApproved && status === "generating" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Sparkles className="h-3 w-3 animate-spin" />
                      Writing...
                    </Badge>
                  )}
                  {isApproved && !status && (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600 text-xs">
                      <Check className="h-3 w-3" />
                      Approved
                    </Badge>
                  )}
                  {!isApproved && (
                    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  <div className="border-t pt-4">
                    {/* Keywords & locations */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      {month.keywords?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {month.keywords.map((kw) => (
                              <span key={kw} className="rounded bg-secondary px-2 py-0.5 text-xs">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {month.locations?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Locations</p>
                          <div className="flex flex-wrap gap-1">
                            {month.locations.map((loc) => (
                              <span key={loc} className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-xs">{loc}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {month.notes && (
                      <div className="flex items-start gap-1.5 mb-4">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{month.notes}</p>
                      </div>
                    )}

                    {/* Blog titles - the main content */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blog Post Titles</p>
                      {titles.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No blog titles yet. Add some below.</p>
                      ) : (
                        <ul className="space-y-1">
                          {titles.map((title, j) => (
                            <li key={j} className="flex items-start gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50 -mx-2">
                              <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-4 text-right">{j + 1}.</span>
                              <span className="flex-1 text-sm">{title}</span>
                              <button
                                type="button"
                                onClick={() => removeTitle(i, j)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity shrink-0"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Add new title */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={newTitle[i] || ""}
                          onChange={(e) => setNewTitle((prev) => ({ ...prev, [i]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTitle(i);
                            }
                          }}
                          placeholder="Add a blog post title..."
                          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-base sm:text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addTitle(i)}
                          className="h-8 px-3 text-xs shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant={isApproved ? "outline" : "default"}
                      onClick={() => approveMonth(i)}
                      className={cn("text-xs h-8", isApproved && "border-green-600 text-green-600")}
                    >
                      {isApproved ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Approved — Click to Unapprove
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Approve This Month
                        </>
                      )}
                    </Button>

                    {isApproved && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleGenerate(i)}
                        disabled={status === "generating"}
                        className="text-xs h-8"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {status === "generating"
                          ? "Writing..."
                          : status === "generated"
                            ? "Regenerate Posts"
                            : "Write Blog Posts"}
                      </Button>
                    )}

                    {status === "generated" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Written Content
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
