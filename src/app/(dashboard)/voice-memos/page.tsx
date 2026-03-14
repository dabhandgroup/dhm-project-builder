"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyButton } from "@/components/shared/copy-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { mockVoiceMemos, getProjectById } from "@/lib/mock-data";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export default function VoiceMemosPage() {
  const [memos, setMemos] = useState(mockVoiceMemos);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const allMemos = memos;

  function deleteMemo(id: string) {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Memos"
        description="Record and transcribe your thoughts"
      />

      {/* Record New Memo */}
      <VoiceRecorder />

      {/* Memos List */}
      {allMemos.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No voice memos yet"
          description="Use the record button above to capture and transcribe your thoughts."
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Memos ({allMemos.length})
          </h2>
          {allMemos.map((memo) => {
            const project = memo.project_id ? getProjectById(memo.project_id) : null;
            return (
              <Card key={memo.id}>
                <CardContent className="p-4 sm:p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {project ? (
                          <Badge variant="secondary" className="text-xs">
                            {project.title}
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
                          {formatDate(memo.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {memo.transcription}
                      </p>
                      {memo.summary && (
                        <div className="rounded-md bg-muted/50 p-3 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Summary
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {memo.summary}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <CopyButton
                        text={
                          memo.summary
                            ? `Transcript\n${memo.transcription}\n\nSummary\n${memo.summary}`
                            : `Transcript\n${memo.transcription}`
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
        onConfirm={() => { if (deleteId) deleteMemo(deleteId); }}
      />
    </div>
  );
}
