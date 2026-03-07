import { NextRequest, NextResponse } from "next/server";
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

    // Generate summary for longer transcriptions
    let summary: string | null = null;
    const wordCount = transcriptionText.split(/\s+/).length;

    if (wordCount > 50) {
      const summaryResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Summarize the following transcription into clear, actionable bullet points. Remove filler words and repetition. Keep it concise and professional.",
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
    await supabase.from("voice_memos").insert({
      transcription: transcriptionText,
      summary,
      source_field: fieldName,
      project_id: projectId || null,
      created_by: user.id,
      duration_seconds: null,
    });

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
