"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  StickyNote,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface Note {
  id: string;
  title: string;
  content: string;
  projectId: string | null;
  createdAt: string;
}

interface ProjectOption {
  id: string;
  title: string;
}

export function NotesClient({ projects }: { projects: ProjectOption[] }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function addNote() {
    if (!newContent.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || "Untitled note",
      content: newContent.trim(),
      projectId: newProjectId || null,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setNewTitle("");
    setNewContent("");
    setNewProjectId("");
    setShowForm(false);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function copyNote(note: Note) {
    navigator.clipboard.writeText(note.content);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getProjectTitle(projectId: string | null) {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.title ?? null;
  }

  const filteredNotes = filterProject
    ? notes.filter((n) => n.projectId === filterProject)
    : notes;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Notes" description="Quick notes and comments for your projects">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </PageHeader>

      {/* Filter by project */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground shrink-0">Filter by project:</Label>
        <Select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          options={[
            { value: "", label: "All notes" },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          placeholder="All notes"
        />
      </div>

      {/* New note form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Homepage copy ideas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Use bullet points with • or - ..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-project">Assign to Project (optional)</Label>
              <Select
                id="note-project"
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                options={[
                  { value: "", label: "No project" },
                  ...projects.map((p) => ({ value: p.id, label: p.title })),
                ]}
                placeholder="Select project"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={addNote} disabled={!newContent.trim()}>
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <StickyNote className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filterProject ? "No notes for this project." : "No notes yet. Click 'Add Note' to create one."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const isCopied = copiedId === note.id;

            return (
              <Card key={note.id}>
                <CardContent className="p-4 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">{note.title}</h3>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {note.content}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-2">
                        {new Date(note.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {note.projectId && (
                          <> &middot; {getProjectTitle(note.projectId)}</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyNote(note)}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Copy note"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(note.id)}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteId) deleteNote(deleteId); }}
      />
    </div>
  );
}
