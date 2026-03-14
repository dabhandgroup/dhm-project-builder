import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyButton } from "@/components/shared/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { mockVoiceMemos, getProjectById } from "@/lib/mock-data";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export default function VoiceMemosPage() {
  const allMemos = mockVoiceMemos;

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
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {project && (
                          <Badge variant="secondary" className="text-xs">
                            {project.title}
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
                    <CopyButton text={memo.transcription} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
