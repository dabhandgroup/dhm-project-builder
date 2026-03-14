"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PenTool, Plus, FileText, ChevronRight, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { mockContentPlans, getProjectById, mockProjects } from "@/lib/mock-data";

export default function ContentPage() {
  const [plans] = useState(mockContentPlans);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    client_name: "",
    business_type: "",
    target_audience: "",
    locations: "",
    monthly_post_count: "4",
    notes: "",
  });

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowForm(false);
    }, 2000);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Content">
        <Button onPointerDown={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          New Plan
        </Button>
      </PageHeader>

      {plans.length === 0 ? (
        <EmptyState
          icon={PenTool}
          title="No content plans yet"
          description="Generate a 12-month content plan for your clients."
        >
          <Button size="sm" onPointerDown={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Create Content Plan
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const project = getProjectById(plan.project_id);
            const planData = plan.plan_data as { month: string; topic: string; blogTitles?: string[] }[];
            const totalPosts = planData.reduce((sum, m) => sum + (m.blogTitles?.length ?? 0), 0);

            return (
              <Link key={plan.id} href={`/content/${plan.project_id}`}>
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {project?.title ?? "Unknown Project"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totalPosts} posts across 12 months &middot; {formatDate(plan.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Generate New Plan Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Content Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link to Project (optional)</Label>
              <Select
                value={formData.project_id}
                onChange={(e) => {
                  const proj = mockProjects.find((p) => p.id === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    project_id: e.target.value,
                    client_name: proj?.title?.split("—")[0]?.trim() ?? prev.client_name,
                  }));
                }}
                options={[
                  { value: "", label: "None — standalone plan" },
                  ...mockProjects.map((p) => ({ value: p.id, label: p.title })),
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>Client / Business Name</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                placeholder="e.g. Richardson Legal"
              />
            </div>

            <div className="space-y-2">
              <Label>Business Type / Industry</Label>
              <Input
                value={formData.business_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, business_type: e.target.value }))}
                placeholder="e.g. Family law solicitor"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Input
                value={formData.target_audience}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_audience: e.target.value }))}
                placeholder="e.g. Homeowners in Manchester"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Locations</Label>
              <Input
                value={formData.locations}
                onChange={(e) => setFormData((prev) => ({ ...prev, locations: e.target.value }))}
                placeholder="e.g. Manchester, Salford, Stockport"
              />
            </div>

            <div className="space-y-2">
              <Label>Posts per Month</Label>
              <Select
                value={formData.monthly_post_count}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthly_post_count: e.target.value }))}
                options={[
                  { value: "2", label: "2 posts" },
                  { value: "3", label: "3 posts" },
                  { value: "4", label: "4 posts" },
                  { value: "6", label: "6 posts" },
                  { value: "8", label: "8 posts" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any specific topics, keywords, or goals..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="flex-1 h-11" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button className="flex-1 h-11" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PenTool className="h-4 w-4" />
                  Generate Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
