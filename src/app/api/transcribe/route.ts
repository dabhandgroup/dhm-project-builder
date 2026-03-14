import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getGroqClient } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const fieldName = formData.get("fieldName") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const groq = getGroqClient();

    // Transcribe with Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "text",
    });

    const transcriptionText =
      typeof transcription === "string"
        ? transcription
        : (transcription as { text?: string }).text ?? String(transcription);

    // Generate actionable summary for AI consumption
    let summary: string | null = null;
    const wordCount = transcriptionText.split(/\s+/).length;

    if (wordCount > 5) {
      const summaryResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You extract actionable points from voice memo transcriptions. Output a concise list of clear, specific action items and key decisions that an AI assistant can act on. Format as bullet points. Remove filler words, repetition, and small talk. Focus on: tasks to do, decisions made, requirements stated, and ideas to explore. If the memo is very short, summarise the core intent in one bullet.",
          },
          {
            role: "user",
            content: transcriptionText,
          },
        ],
        max_tokens: 500,
      });
      summary =
        summaryResponse.choices[0]?.message?.content ?? null;
    }

    // Save voice memo
    const { error: insertError } = await supabase.from("voice_memos").insert({
      transcription: transcriptionText,
      summary,
      source_field: fieldName,
      project_id: projectId || null,
      created_by: user.id,
      duration_seconds: null,
    });

    if (insertError) {
      console.error("Failed to save voice memo:", insertError);
      return NextResponse.json(
        { error: "Failed to save memo" },
        { status: 500 }
      );
    }

    revalidatePath("/voice-memos");

    return NextResponse.json({
      transcription: transcriptionText,
      summary,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
