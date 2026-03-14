"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, PenTool, Loader2 } from "lucide-react";
import { mockProjects } from "@/lib/mock-data";

export default function NewContentPlanPage() {
  const router = useRouter();
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
      router.push("/content");
    }, 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/content">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Create Content Plan</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Button className="w-full h-11" onClick={handleGenerate} disabled={generating}>
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Plan...
          </>
        ) : (
          <>
            <PenTool className="h-4 w-4" />
            Generate Content Plan
          </>
        )}
      </Button>
    </div>
  );
}
