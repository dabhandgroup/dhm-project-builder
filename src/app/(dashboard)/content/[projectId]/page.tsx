"use client";

import { useState, use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface MonthPlan {
  month: string;
  topic: string;
  keywords: string[];
  locations: string[];
  notes: string;
  blogTitles?: string[];
}

type ContentType = "blog" | "service_page" | "website_page" | "locational_page";
type ContentStatus = "not_started" | "generating" | "generated";

const contentTypeLabels: Record<ContentType, string> = {
  blog: "Blog Post",
  service_page: "Service Page",
  website_page: "Website Page",
  locational_page: "Locational Page",
};

const contentTypeOptions = [
  { value: "blog", label: "Blog Post" },
  { value: "service_page", label: "Service Page" },
  { value: "website_page", label: "Website Page" },
  { value: "locational_page", label: "Locational Page" },
];

const defaultWordCounts: Record<ContentType, number> = {
  blog: 1500,
  service_page: 2500,
  website_page: 1500,
  locational_page: 2500,
};

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
  const [contentTypes, setContentTypes] = useState<Record<string, ContentType>>({});
  const [editingTitle, setEditingTitle] = useState<{ month: number; index: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newTitle, setNewTitle] = useState<Record<number, string>>({});
  const [newTitleType, setNewTitleType] = useState<Record<number, ContentType>>({});
  const [contentStatus, setContentStatus] = useState<Record<number, ContentStatus>>({});
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ month: number; index: number } | null>(null);

  const allApproved = approvedMonths.size === planData.length;

  function getContentTypeKey(monthIdx: number, titleIdx: number) {
    return `${monthIdx}-${titleIdx}`;
  }

  function getContentType(monthIdx: number, titleIdx: number): ContentType {
    return contentTypes[getContentTypeKey(monthIdx, titleIdx)] ?? "blog";
  }

  function setContentType(monthIdx: number, titleIdx: number, type: ContentType) {
    setContentTypes((prev) => ({ ...prev, [getContentTypeKey(monthIdx, titleIdx)]: type }));
    // Set default word count when type changes
    const key = getContentTypeKey(monthIdx, titleIdx);
    if (!wordCounts[key]) {
      setWordCounts((prev) => ({ ...prev, [key]: defaultWordCounts[type] }));
    }
  }

  function getWordCount(monthIdx: number, titleIdx: number): number {
    const key = getContentTypeKey(monthIdx, titleIdx);
    return wordCounts[key] ?? defaultWordCounts[getContentType(monthIdx, titleIdx)];
  }

  function setWordCount(monthIdx: number, titleIdx: number, count: number) {
    setWordCounts((prev) => ({ ...prev, [getContentTypeKey(monthIdx, titleIdx)]: count }));
  }

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
      // Start writing only the first month
      handleGenerate(0);
    }
  }

  function addTitle(monthIndex: number) {
    const title = newTitle[monthIndex]?.trim();
    if (!title) return;
    const type = newTitleType[monthIndex] ?? "blog";
    const newIdx = (blogTitles[monthIndex] || []).length;
    setBlogTitles((prev) => ({
      ...prev,
      [monthIndex]: [...(prev[monthIndex] || []), title],
    }));
    const key = getContentTypeKey(monthIndex, newIdx);
    setContentTypes((prev) => ({ ...prev, [key]: type }));
    setWordCounts((prev) => ({ ...prev, [key]: defaultWordCounts[type] }));
    setNewTitle((prev) => ({ ...prev, [monthIndex]: "" }));
  }

  function removeTitle(monthIndex: number, titleIndex: number) {
    setBlogTitles((prev) => ({
      ...prev,
      [monthIndex]: prev[monthIndex]?.filter((_, i) => i !== titleIndex) || [],
    }));
  }

  function startEditing(monthIndex: number, titleIndex: number) {
    setEditingTitle({ month: monthIndex, index: titleIndex });
    setEditingValue(blogTitles[monthIndex]?.[titleIndex] ?? "");
  }

  function saveEditing() {
    if (!editingTitle) return;
    const { month, index } = editingTitle;
    setBlogTitles((prev) => ({
      ...prev,
      [month]: prev[month]?.map((t, i) => (i === index ? editingValue : t)) || [],
    }));
    setEditingTitle(null);
  }

  function handleGenerate(monthIndex: number) {
    setContentStatus((prev) => ({ ...prev, [monthIndex]: "generating" }));
    setTimeout(() => {
      setContentStatus((prev) => ({ ...prev, [monthIndex]: "generated" }));
    }, 2000);
  }

  function handleGenerateAll() {
    // Only generate the first approved month that hasn't been generated
    const firstUnapproved = [...approvedMonths].sort((a, b) => a - b).find(
      (idx) => contentStatus[idx] !== "generated"
    );
    if (firstUnapproved !== undefined) {
      handleGenerate(firstUnapproved);
    }
  }

  const approvedCount = approvedMonths.size;
  const generatedCount = Object.values(contentStatus).filter((s) => s === "generated").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Content Plan"
        description={project?.title ?? ""}
      >
        <Button
          variant="outline"
          size="sm"
          onPointerDown={approveAll}
          className={cn(allApproved && "border-green-600 text-green-600")}
        >
          <CheckCheck className="h-4 w-4" />
          {allApproved ? "All Approved" : "Approve All"}
        </Button>
      </PageHeader>

      {/* Phase cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className={cn("border-l-4", approvedCount > 0 ? "border-l-green-500" : "border-l-primary")}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              {approvedCount === 12 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Pencil className="h-4 w-4 text-primary" />
              )}
              <p className="text-sm font-semibold">Content Plan</p>
              <Badge variant="secondary" className="ml-auto text-xs">
                {approvedCount}/12
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Review titles for each month. Edit, reorder, or add new ones before approving.
            </p>
          </CardContent>
        </Card>
        <Card className={cn("border-l-4", approvedCount > 0 ? "border-l-primary" : "border-l-muted")}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className={cn("h-4 w-4", approvedCount > 0 ? "text-primary" : "text-muted-foreground")} />
              <p className={cn("text-sm font-semibold", approvedCount === 0 && "text-muted-foreground")}>Written Content</p>
              <Badge variant="secondary" className="ml-auto text-xs">
                {generatedCount}/12
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedCount > 0 ? (
                <>
                  Write content for approved months.
                  {approvedCount > 1 && generatedCount < approvedCount && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 ml-1 text-xs"
                      onClick={handleGenerateAll}
                    >
                      Write next month
                    </Button>
                  )}
                </>
              ) : (
                "Approve at least one month to start generating."
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
                className="flex w-full items-center gap-2 sm:gap-3 p-3 sm:p-4 text-left hover:bg-accent/30 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{month.month}</span>
                    <span className="text-xs text-muted-foreground truncate">{month.topic}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {titles.length} {titles.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isApproved && status === "generated" && (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Written</span>
                    </Badge>
                  )}
                  {isApproved && status === "generating" && (
                    <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <Sparkles className="h-3 w-3 animate-spin" />
                      <span className="hidden sm:inline">Writing...</span>
                    </Badge>
                  )}
                  {isApproved && !status && (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <Check className="h-3 w-3" />
                      <span className="hidden sm:inline">Approved</span>
                    </Badge>
                  )}
                  {!isApproved && (
                    <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs text-muted-foreground px-1.5 sm:px-2">
                      <Clock className="h-3 w-3" />
                      <span className="hidden sm:inline">Pending</span>
                    </Badge>
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-4 space-y-3">
                  <div className="border-t pt-3">
                    {/* Keywords & locations */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      {month.keywords?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {month.keywords.map((kw) => (
                              <span key={kw} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {month.locations?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Locations</p>
                          <div className="flex flex-wrap gap-1">
                            {month.locations.map((loc) => (
                              <span key={loc} className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 text-[11px]">{loc}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {month.notes && (
                      <div className="flex items-start gap-1.5 mb-3">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{month.notes}</p>
                      </div>
                    )}

                    {/* Content items */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Content Items</p>
                      {titles.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No content items yet. Add some below.</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {titles.map((title, j) => {
                            const isEditing = editingTitle?.month === i && editingTitle?.index === j;
                            const type = getContentType(i, j);
                            const isGenerated = status === "generated";

                            return (
                              <li key={j} className="group rounded-md hover:bg-muted/50">
                                {isEditing ? (
                                  <div className="flex gap-1.5 p-1.5">
                                    <Input
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEditing();
                                        if (e.key === "Escape") setEditingTitle(null);
                                      }}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                    <Button size="sm" className="h-8 px-2 shrink-0" onClick={saveEditing}>
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => setEditingTitle(null)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 px-2 py-2 -mx-2">
                                    {/* Title - clickable when generated */}
                                    <div className="flex-1 min-w-0">
                                      {isGenerated ? (
                                        <Link
                                          href={`/content/${projectId}/post/${i}-${j}`}
                                          className="text-sm text-primary hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {title}
                                        </Link>
                                      ) : (
                                        <span className="text-sm">{title}</span>
                                      )}
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          {contentTypeLabels[type]}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                          {getWordCount(i, j).toLocaleString()} words
                                        </span>
                                      </div>
                                    </div>

                                    {/* Actions - always visible on mobile */}
                                    <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => startEditing(i, j)}
                                        className="p-1.5 rounded hover:bg-accent active:bg-accent"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteTarget({ month: i, index: j })}
                                        className="p-1.5 rounded hover:bg-destructive/10 active:bg-destructive/10"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Add new item */}
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
                          <div className="col-span-2 sm:w-32 sm:shrink-0">
                            <Select
                              value={newTitleType[i] ?? "blog"}
                              onChange={(e) => setNewTitleType((prev) => ({ ...prev, [i]: e.target.value as ContentType }))}
                              options={contentTypeOptions}
                              className="h-9 sm:h-8 text-xs"
                            />
                          </div>
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
                            placeholder="Add title..."
                            className="min-w-0 rounded-md border bg-background px-3 py-1.5 text-base sm:text-sm outline-none focus:ring-1 focus:ring-ring h-9 sm:h-8 sm:flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addTitle(i)}
                            className="h-9 sm:h-8 px-2 text-xs shrink-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Default word count: {defaultWordCounts[newTitleType[i] ?? "blog"].toLocaleString()} words
                          {(newTitleType[i] ?? "blog") === "locational_page" && (
                            <span className="ml-1">&middot; Targets specific suburbs/locations for local SEO rankings</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant={isApproved ? "outline" : "default"}
                      onClick={() => approveMonth(i)}
                      className={cn("text-xs h-8", isApproved && "border-green-600 text-green-600")}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isApproved ? "Approved" : "Approve"}
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
                            ? "Regenerate"
                            : "Write Content"}
                      </Button>
                    )}

                    {status === "generated" && (
                      <Link href={`/content/${projectId}/post/${i}-0`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Content
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete content item"
        description="Are you sure you want to delete this content item? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) removeTitle(deleteTarget.month, deleteTarget.index);
        }}
      />
    </div>
  );
}
