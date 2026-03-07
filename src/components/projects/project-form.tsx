"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadZone } from "@/components/projects/image-upload-zone";
import { MicButton } from "@/components/voice/mic-button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { aiModels } from "@/constants/ai-models";
import { X, Save, Loader2, Cloud, CloudOff } from "lucide-react";
import type { ProjectFormData } from "@/types/project";
import { defaultProjectFormData } from "@/types/project";

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  projectId?: string;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onSaveDraft?: (data: ProjectFormData) => Promise<void>;
  isEditing?: boolean;
}

export function ProjectForm({
  initialData,
  projectId,
  onSubmit,
  onSaveDraft,
  isEditing = false,
}: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    ...defaultProjectFormData,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  const { isSaving, lastSaved, isDirty } = useAutoSave({
    data: form,
    onSave: async (data) => {
      if (onSaveDraft) await onSaveDraft(data);
    },
    enabled: !!onSaveDraft,
  });

  const updateField = useCallback(
    <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateContactField = useCallback(
    (field: keyof ProjectFormData["contact_info"], value: string) => {
      setForm((prev) => ({
        ...prev,
        contact_info: { ...prev.contact_info, [field]: value },
      }));
    },
    []
  );

  const addLocation = useCallback(() => {
    const trimmed = locationInput.trim();
    if (trimmed && !form.target_locations.includes(trimmed)) {
      updateField("target_locations", [...form.target_locations, trimmed]);
      setLocationInput("");
    }
  }, [locationInput, form.target_locations, updateField]);

  const removeLocation = useCallback(
    (location: string) => {
      updateField(
        "target_locations",
        form.target_locations.filter((l) => l !== location)
      );
    },
    [form.target_locations, updateField]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-save indicator */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        {isSaving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </>
        ) : isDirty ? (
          <>
            <CloudOff className="h-3 w-3" />
            Unsaved changes
          </>
        ) : lastSaved ? (
          <>
            <Cloud className="h-3 w-3" />
            Saved
          </>
        ) : null}
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <div className="flex items-center gap-1">
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Nationwide Towing Website"
                required
                className="flex-1"
              />
              <MicButton
                onTranscription={(text) =>
                  updateField("title", form.title ? `${form.title} ${text}` : text)
                }
                fieldName="title"
                projectId={projectId}
              />
            </div>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain_name">Domain Name</Label>
            <Input
              id="domain_name"
              value={form.domain_name}
              onChange={(e) => updateField("domain_name", e.target.value)}
              placeholder="e.g. nationwidetowing.com.au"
            />
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name</Label>
            <Input
              id="client_name"
              value={form.client_name}
              onChange={(e) => updateField("client_name", e.target.value)}
              placeholder="e.g. John Smith"
            />
          </div>

          {/* New Build / Rebuild toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="is_rebuild"
              checked={form.is_rebuild}
              onCheckedChange={(checked) => updateField("is_rebuild", checked)}
            />
            <Label htmlFor="is_rebuild">
              {form.is_rebuild ? "Rebuild (existing site)" : "New Build"}
            </Label>
          </div>

          {/* Sitemap URL (shown for rebuilds) */}
          {form.is_rebuild && (
            <div className="space-y-2">
              <Label htmlFor="sitemap_url">Existing Sitemap URL</Label>
              <Input
                id="sitemap_url"
                value={form.sitemap_url}
                onChange={(e) => updateField("sitemap_url", e.target.value)}
                placeholder="e.g. https://example.com/sitemap.xml"
              />
              <p className="text-xs text-muted-foreground">
                The sitemap will be crawled to rebuild all existing pages
              </p>
            </div>
          )}

          {/* AI Model */}
          <div className="space-y-2">
            <Label htmlFor="ai_model">AI Model</Label>
            <Select
              id="ai_model"
              value={form.ai_model}
              onChange={(e) => updateField("ai_model", e.target.value)}
              options={aiModels.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
              placeholder="Select AI model"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <ImageUploadZone
              label="Favicon"
              value={form.favicon ? [form.favicon] : []}
              onChange={(files) => updateField("favicon", files[0] || null)}
              single
              accept="image/*"
            />
            <ImageUploadZone
              label="Client Logo"
              value={form.logo ? [form.logo] : []}
              onChange={(files) => updateField("logo", files[0] || null)}
              single
              accept="image/*,.svg"
            />
            <ImageUploadZone
              label="Alternative Logo"
              value={form.alt_logo ? [form.alt_logo] : []}
              onChange={(files) => updateField("alt_logo", files[0] || null)}
              single
              accept="image/*,.svg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brief & Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brief & Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pages Required */}
          <div className="space-y-2">
            <Label htmlFor="pages_required">Pages Required</Label>
            <div className="relative">
              <Textarea
                id="pages_required"
                value={form.pages_required}
                onChange={(e) => updateField("pages_required", e.target.value)}
                placeholder="List the pages needed, e.g.:\n- Home\n- About\n- Services\n- Contact"
                rows={4}
                className="pr-10"
              />
              <div className="absolute right-1 top-1">
                <MicButton
                  onTranscription={(text) =>
                    updateField(
                      "pages_required",
                      form.pages_required
                        ? `${form.pages_required}\n${text}`
                        : text
                    )
                  }
                  fieldName="pages_required"
                  projectId={projectId}
                />
              </div>
            </div>
          </div>

          {/* Brief */}
          <div className="space-y-2">
            <Label htmlFor="brief">Brief</Label>
            <div className="relative">
              <Textarea
                id="brief"
                value={form.brief}
                onChange={(e) => updateField("brief", e.target.value)}
                placeholder="Describe what the client needs, their business, target audience, style preferences..."
                rows={6}
                className="pr-10"
              />
              <div className="absolute right-1 top-1">
                <MicButton
                  onTranscription={(text) =>
                    updateField(
                      "brief",
                      form.brief ? `${form.brief}\n${text}` : text
                    )
                  }
                  onSummary={(summary) => updateField("brief_summary", summary)}
                  fieldName="brief"
                  projectId={projectId}
                />
              </div>
            </div>
          </div>

          {/* Brief Summary (auto-generated) */}
          {form.brief_summary && (
            <div className="space-y-2">
              <Label>AI Summary</Label>
              <div className="rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                {form.brief_summary}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <div className="relative">
              <Textarea
                id="additional_notes"
                value={form.additional_notes}
                onChange={(e) =>
                  updateField("additional_notes", e.target.value)
                }
                placeholder="Any other information..."
                rows={3}
                className="pr-10"
              />
              <div className="absolute right-1 top-1">
                <MicButton
                  onTranscription={(text) =>
                    updateField(
                      "additional_notes",
                      form.additional_notes
                        ? `${form.additional_notes}\n${text}`
                        : text
                    )
                  }
                  fieldName="additional_notes"
                  projectId={projectId}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadZone
              label="Square Images"
              value={form.square_images}
              onChange={(files) => updateField("square_images", files)}
              maxFiles={20}
            />
            <ImageUploadZone
              label="Landscape Images"
              value={form.landscape_images}
              onChange={(files) => updateField("landscape_images", files)}
              maxFiles={20}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={form.contact_info.phone}
                onChange={(e) => updateContactField("phone", e.target.value)}
                placeholder="e.g. 0412 345 678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={form.contact_info.email}
                onChange={(e) => updateContactField("email", e.target.value)}
                placeholder="e.g. info@business.com.au"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_address">Address</Label>
            <Input
              id="contact_address"
              value={form.contact_info.address}
              onChange={(e) => updateContactField("address", e.target.value)}
              placeholder="e.g. 123 Main St, Sydney NSW 2000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_maps_embed">Google Maps Embed</Label>
            <Textarea
              id="google_maps_embed"
              value={form.google_maps_embed}
              onChange={(e) =>
                updateField("google_maps_embed", e.target.value)
              }
              placeholder="Paste the Google Maps embed iframe code here"
              rows={2}
            />
          </div>

          {/* Target Locations */}
          <div className="space-y-2">
            <Label htmlFor="target_locations">Target Locations</Label>
            <div className="flex gap-2">
              <Input
                id="target_locations"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g. Sydney CBD"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLocation();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
              >
                Add
              </Button>
            </div>
            {form.target_locations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.target_locations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                  >
                    {location}
                    <button
                      type="button"
                      onClick={() => removeLocation(location)}
                      className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="one_off_revenue">One-Off Revenue ($)</Label>
              <Input
                id="one_off_revenue"
                type="number"
                min={0}
                step={1}
                value={form.one_off_revenue}
                onChange={(e) =>
                  updateField("one_off_revenue", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring_revenue">
                Monthly Recurring Revenue ($)
              </Label>
              <Input
                id="recurring_revenue"
                type="number"
                min={0}
                step={1}
                value={form.recurring_revenue}
                onChange={(e) =>
                  updateField("recurring_revenue", Number(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onSaveDraft(form)}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Project"
          ) : (
            "Create Project"
          )}
        </Button>
      </div>
    </form>
  );
}
