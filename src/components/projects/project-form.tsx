"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadZone } from "@/components/projects/image-upload-zone";
import { MicButton } from "@/components/voice/mic-button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { aiModels } from "@/constants/ai-models";
import { X, Save, Loader2, Cloud, CloudOff, Search, UserPlus, Building2, Upload, Check } from "lucide-react";
import { mockClients } from "@/lib/mock-data";
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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Client search state
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const { isSaving, lastSaved, isDirty } = useAutoSave({
    data: form,
    onSave: async (data) => {
      if (onSaveDraft) await onSaveDraft(data);
    },
    enabled: !!onSaveDraft,
  });

  // Close client dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredClients = clientSearch.trim()
    ? mockClients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.company?.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : mockClients;

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

  function selectClient(client: typeof mockClients[0]) {
    updateField("client_id", client.id);
    updateField("client_name", client.name);
    updateContactField("phone", client.phone || "");
    updateContactField("email", client.email || "");
    updateContactField("address", client.address || "");
    setClientSearch(client.name);
    setClientDropdownOpen(false);
    setIsNewClient(false);
  }

  function startNewClient() {
    setIsNewClient(true);
    updateField("client_id", "");
    updateField("client_name", clientSearch);
    setClientDropdownOpen(false);
  }

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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

          {/* Client Search / Create */}
          <div className="space-y-2 relative" ref={clientRef}>
            <Label>Client</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={isNewClient ? form.client_name : clientSearch}
                onChange={(e) => {
                  if (isNewClient) {
                    updateField("client_name", e.target.value);
                  } else {
                    setClientSearch(e.target.value);
                    setClientDropdownOpen(true);
                  }
                }}
                onFocus={() => {
                  if (!isNewClient) setClientDropdownOpen(true);
                }}
                placeholder="Search existing clients or create new..."
                className="pl-9"
              />
              {isNewClient && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewClient(false);
                    setClientSearch("");
                    updateField("client_id", "");
                    updateField("client_name", "");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {clientDropdownOpen && !isNewClient && (
              <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border bg-background shadow-lg max-h-[240px] overflow-auto">
                {/* Create new client option */}
                <button
                  type="button"
                  onClick={startNewClient}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors border-b text-sm"
                >
                  <UserPlus className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-primary font-medium">
                    Create new client{clientSearch.trim() ? `: "${clientSearch}"` : ""}
                  </span>
                </button>

                {filteredClients.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No clients found
                  </p>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {client.company} · {client.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {isNewClient && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                Creating new client — fill in contact details below
              </p>
            )}
          </div>

          {/* Build Type */}
          <div className="space-y-2">
            <Label>Build Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField("is_rebuild", false)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                  !form.is_rebuild
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-2xl">🆕</span>
                <span className="text-sm font-medium">New Build</span>
                <span className="text-xs text-muted-foreground">Brand new website</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("is_rebuild", true)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                  form.is_rebuild
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-2xl">🔄</span>
                <span className="text-sm font-medium">Rebuild</span>
                <span className="text-xs text-muted-foreground">Replacing existing site</span>
              </button>
            </div>
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
        <CardContent className="space-y-6">
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

          {/* Choose Template */}
          <div className="space-y-3">
            <Label>Choose Template</Label>
            <p className="text-xs text-muted-foreground">
              Select a pre-made template as the starting point. AI will adapt content, colours, and fonts to match the client.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 16 }, (_, i) => {
                const id = `template-${i + 1}`;
                const isSelected = selectedTemplate === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedTemplate(isSelected ? null : id)}
                    className={`relative group rounded-lg border-2 overflow-hidden transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-muted/60 to-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        Template {i + 1}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="px-2 py-1.5 border-t bg-background">
                      <p className="text-[11px] font-medium truncate">Template {i + 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Project Zip */}
          <div className="space-y-2">
            <Label>Upload Project Files (ZIP)</Label>
            <p className="text-xs text-muted-foreground">
              Upload a zip file with existing project files for reference (designs, assets, content, etc.)
            </p>
            <div
              onClick={() => zipInputRef.current?.click()}
              className="flex items-center gap-3 rounded-lg border-2 border-dashed p-4 cursor-pointer hover:border-muted-foreground/30 transition-colors"
            >
              <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
              {zipFile ? (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{zipFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(zipFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZipFile(null);
                      if (zipInputRef.current) zipInputRef.current.value = "";
                    }}
                    className="p-1 rounded hover:bg-accent"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Click to upload a .zip file
                  </p>
                </div>
              )}
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setZipFile(file);
                }}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brief & Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brief & Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    updateField("pages_required", form.pages_required ? `${form.pages_required}\n${text}` : text)
                  }
                  fieldName="pages_required"
                  projectId={projectId}
                />
              </div>
            </div>
          </div>

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
                    updateField("brief", form.brief ? `${form.brief}\n${text}` : text)
                  }
                  onSummary={(summary) => updateField("brief_summary", summary)}
                  fieldName="brief"
                  projectId={projectId}
                />
              </div>
            </div>
          </div>

          {form.brief_summary && (
            <div className="space-y-2">
              <Label>AI Summary</Label>
              <div className="rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                {form.brief_summary}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <div className="relative">
              <Textarea
                id="additional_notes"
                value={form.additional_notes}
                onChange={(e) => updateField("additional_notes", e.target.value)}
                placeholder="Any other information..."
                rows={3}
                className="pr-10"
              />
              <div className="absolute right-1 top-1">
                <MicButton
                  onTranscription={(text) =>
                    updateField("additional_notes", form.additional_notes ? `${form.additional_notes}\n${text}` : text)
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
              onChange={(e) => updateField("google_maps_embed", e.target.value)}
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
              <Button type="button" variant="outline" size="sm" onClick={addLocation}>
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
        <CardContent className="space-y-4">
          {/* Currency Selector */}
          <div className="space-y-2">
            <Label>Currency / Region</Label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { code: "AUD", label: "AUD", desc: "Australia", flag: "au" },
                { code: "GBP", label: "GBP", desc: "UK", flag: "gb" },
                { code: "USD", label: "USD", desc: "US", flag: "us" },
                { code: "CAD", label: "CAD", desc: "Canada", flag: "ca" },
              ] as const).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => updateField("currency", c.code)}
                  className={`rounded-lg border-2 p-3 text-center transition-all ${
                    form.currency === c.code
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${c.flag}.png`}
                    srcSet={`https://flagcdn.com/w80/${c.flag}.png 2x`}
                    alt={`${c.desc} flag`}
                    className="h-5 w-7 object-cover rounded-sm mx-auto mb-1.5"
                  />
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="one_off_revenue">One-Off Revenue ({form.currency})</Label>
              <Input
                id="one_off_revenue"
                type="number"
                min={0}
                step={1}
                value={form.one_off_revenue}
                onChange={(e) => updateField("one_off_revenue", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring_revenue">Monthly Recurring Revenue ({form.currency})</Label>
              <Input
                id="recurring_revenue"
                type="number"
                min={0}
                step={1}
                value={form.recurring_revenue}
                onChange={(e) => updateField("recurring_revenue", Number(e.target.value))}
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
