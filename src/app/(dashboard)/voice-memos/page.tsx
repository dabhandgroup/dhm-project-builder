import { getVoiceMemos } from "@/lib/queries/voice-memos";
import { VoiceMemosClient } from "./voice-memos-client";

export default async function VoiceMemosPage() {
  const memos = await getVoiceMemos();

  const formattedMemos = memos.map((m) => ({
    id: m.id,
    transcription: m.transcription,
    summary: m.summary,
    project_id: m.project_id,
    projectTitle: (m as Record<string, unknown>).projects
      ? ((m as Record<string, unknown>).projects as { title: string })?.title ?? null
      : null,
    source_field: m.source_field,
    created_at: m.created_at,
  }));

  return <VoiceMemosClient initialMemos={formattedMemos} />;
}
