import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyButton } from "@/components/shared/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function VoiceMemosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memos } = await supabase
    .from("voice_memos")
    .select("*, projects(title)")
    .eq("created_by", user?.id ?? "")
    .order("created_at", { ascending: false });

  const allMemos = memos ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Memos"
        description="All your recorded transcriptions"
      />

      {allMemos.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No voice memos yet"
          description="Use the microphone button on any text field to record and transcribe your thoughts."
        />
      ) : (
        <div className="space-y-3">
          {allMemos.map((memo) => {
            const project = memo.projects as { title: string } | null;
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
