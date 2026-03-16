"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/toast";
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Loader2,
  LayoutTemplate,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { createTemplate, updateTemplate, deleteTemplate } from "@/actions/templates";
import { uploadFile } from "@/lib/storage";
import type { Template } from "@/types/template";

interface TemplatesClientProps {
  initialTemplates: Template[];
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName("");
    setCategory("");
    setFramework("nextjs");
    setThumbnailFile(null);
    setTemplateFile(null);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(tmpl: Template) {
    setName(tmpl.name);
    setCategory(tmpl.category ?? "");
    setFramework(tmpl.framework);
    setEditingId(tmpl.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setSaving(true);

    let thumbnail_url: string | undefined;
    let storage_path: string | undefined;

    try {
      if (thumbnailFile) {
        const path = `template-thumbnails/${Date.now()}-${thumbnailFile.name}`;
        await uploadFile("project-assets", path, thumbnailFile);
        // Store as proxy URL so it works regardless of bucket privacy settings
        thumbnail_url = `/api/storage?bucket=project-assets&path=${encodeURIComponent(path)}`;
      }

      if (templateFile) {
        const path = `files/${Date.now()}-${templateFile.name}`;
        await uploadFile("templates", path, templateFile);
        storage_path = path;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: `Upload error: ${message}`, variant: "destructive" });
      setSaving(false);
      return;
    }

    if (editingId) {
      const result = await updateTemplate(editingId, {
        name: name.trim(),
        category: category.trim() || undefined,
        framework,
        ...(thumbnail_url && { thumbnail_url }),
        ...(storage_path && { storage_path }),
      });

      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? {
                  ...t,
                  name: name.trim(),
                  category: category.trim() || null,
                  framework,
                  ...(thumbnail_url && { thumbnail_url }),
                  ...(storage_path && { storage_path }),
                }
              : t
          )
        );
        toast({ title: "Template updated" });
        resetForm();
      }
    } else {
      if (!templateFile) {
        toast({ title: "Please upload a template file", variant: "destructive" });
        setSaving(false);
        return;
      }

      const result = await createTemplate({
        name: name.trim(),
        category: category.trim() || undefined,
        framework,
        thumbnail_url: thumbnail_url ?? undefined,
        storage_path: storage_path!,
      });

      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        setTemplates((prev) => [
          {
            id: result.id!,
            name: name.trim(),
            description: null,
            category: category.trim() || null,
            framework,
            thumbnail_url: thumbnail_url ?? null,
            storage_path: storage_path!,
            is_active: true,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        toast({ title: "Template created" });
        resetForm();
      }
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteTemplate(deleteId);
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
      toast({ title: "Template deleted" });
    }
    setDeleteId(null);
    setDeleting(false);
  }

  async function toggleActive(tmpl: Template) {
    const result = await updateTemplate(tmpl.id, { is_active: !tmpl.is_active });
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, is_active: !t.is_active } : t))
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Templates" description="Manage website templates for client projects">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Add Template
        </Button>
      </PageHeader>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Edit Template" : "New Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Modern Business"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Business, E-commerce"
                />
              </div>
              <div className="space-y-2">
                <Label>Framework</Label>
                <Select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  options={[
                    { value: "nextjs", label: "Next.js" },
                    { value: "html", label: "HTML/CSS" },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <div
                onClick={() => thumbnailRef.current?.click()}
                className="flex items-center gap-3 rounded-lg border-2 border-dashed p-3 cursor-pointer hover:border-muted-foreground/30 transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {thumbnailFile ? thumbnailFile.name : "Click to upload thumbnail"}
                </span>
              </div>
              <input
                ref={thumbnailRef}
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label>Template File (ZIP)</Label>
              <div
                onClick={() => templateFileRef.current?.click()}
                className="flex items-center gap-3 rounded-lg border-2 border-dashed p-3 cursor-pointer hover:border-muted-foreground/30 transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {templateFile ? templateFile.name : "Click to upload template ZIP"}
                </span>
              </div>
              <input
                ref={templateFileRef}
                type="file"
                accept=".zip"
                onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Update" : "Create"} Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && !showForm ? (
        <Card>
          <CardContent className="!p-8 !pb-12 text-center">
            <LayoutTemplate className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No templates yet. Click &quot;Add Template&quot; to upload one.
            </p>
          </CardContent>
        </Card>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className={`overflow-hidden ${!tmpl.is_active ? "opacity-60" : ""}`}>
              <div className="aspect-[2/1] bg-gradient-to-br from-muted/60 to-muted flex items-center justify-center overflow-hidden">
                {tmpl.thumbnail_url ? (
                  <img
                    src={tmpl.thumbnail_url}
                    alt={tmpl.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If direct URL fails (private bucket), try proxy
                      const img = e.currentTarget;
                      const url = img.src;
                      if (!url.includes("/api/storage")) {
                        // Extract bucket and path from Supabase URL
                        const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
                        if (match) {
                          img.src = `/api/storage?bucket=${match[1]}&path=${encodeURIComponent(match[2])}`;
                        }
                      }
                    }}
                  />
                ) : (
                  <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="!p-2 !pt-2 space-y-1.5">
                <div>
                  <p className="text-sm font-medium truncate">{tmpl.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tmpl.category && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{tmpl.category}</span>
                    )}
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{tmpl.framework === "nextjs" ? "Next.js" : "HTML/CSS"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleActive(tmpl)}
                    className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
                    title={tmpl.is_active ? "Deactivate" : "Activate"}
                  >
                    {tmpl.is_active ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(tmpl)}
                    className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(tmpl.id)}
                    className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete template"
        description="Are you sure you want to delete this template? This cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
