"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyButton } from "@/components/shared/copy-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, Trash2, Search } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { deleteVoiceMemo } from "@/actions/voice-memos";
import { toast } from "@/components/ui/toast";

interface Memo {
  id: string;
  transcription: string;
  summary: string | null;
  project_id: string | null;
  projectTitle: string | null;
  source_field: string | null;
  created_at: string;
}

function parseMemoTitle(summary: string | null): { title: string | null; body: string | null } {
  if (!summary) return { title: null, body: null };
  const match = summary.match(/^\[title\](.*?)\[\/title\]\n?([\s\S]*)$/);
  if (match) {
    return {
      title: match[1].trim(),
      body: match[2].trim() || null,
    };
  }
  return { title: null, body: summary };
}

export function VoiceMemosClient({ initialMemos }: { initialMemos: Memo[] }) {
  const [memos, setMemos] = useState(initialMemos);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Sync memos when server data changes (e.g. after router.refresh())
  useEffect(() => {
    setMemos(initialMemos);
  }, [initialMemos]);

  function handleMemoCreated() {
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteVoiceMemo(id);
    if (result.error) {
      toast({ title: "Error deleting memo", variant: "destructive" });
      return;
    }
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }

  const filteredMemos = useMemo(() => {
    if (!searchQuery.trim()) return memos;
    const q = searchQuery.toLowerCase();
    return memos.filter((memo) => {
      const { title } = parseMemoTitle(memo.summary);
      return (
        memo.transcription.toLowerCase().includes(q) ||
        (title && title.toLowerCase().includes(q)) ||
        (memo.summary && memo.summary.toLowerCase().includes(q)) ||
        (memo.projectTitle && memo.projectTitle.toLowerCase().includes(q))
      );
    });
  }, [memos, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Memos"
        description="Record and transcribe your thoughts"
      />

      {/* Record New Memo */}
      <VoiceRecorder onMemoCreated={handleMemoCreated} />

      {/* Search */}
      {memos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Memos List */}
      {memos.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No voice memos yet"
          description="Use the record button above to capture and transcribe your thoughts."
        />
      ) : filteredMemos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No memos match &ldquo;{searchQuery}&rdquo;
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {searchQuery ? `Results (${filteredMemos.length})` : `Recent Memos (${memos.length})`}
          </h2>
          {filteredMemos.map((memo) => {
            const { title, body } = parseMemoTitle(memo.summary);
            return (
              <Card key={memo.id}>
                <CardContent className="p-4 sm:p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {title && (
                        <h3 className="text-sm font-semibold">{title}</h3>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {memo.projectTitle ? (
                          <Badge variant="secondary" className="text-xs">
                            {memo.projectTitle}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            General Note
                          </Badge>
                        )}
                        {memo.source_field && (
                          <Badge variant="outline" className="text-xs">
                            {memo.source_field}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(memo.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {memo.transcription}
                      </p>
                      {body && (
                        <div className="rounded-md bg-muted/50 p-3 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Actionable Points
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {body}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <CopyButton
                        text={
                          body
                            ? `${title ? `${title}\n\n` : ""}Transcript\n${memo.transcription}\n\nActionable Points\n${body}`
                            : `${title ? `${title}\n\n` : ""}Transcript\n${memo.transcription}`
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setDeleteId(memo.id)}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete memo"
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
        title="Delete memo"
        description="Are you sure you want to delete this voice memo? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteId) handleDelete(deleteId); }}
      />
    </div>
  );
}
