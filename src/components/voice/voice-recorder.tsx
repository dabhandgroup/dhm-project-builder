"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2, Pause, Play } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { toast } from "@/components/ui/toast";

interface VoiceRecorderProps {
  onMemoCreated?: () => void;
}

export function VoiceRecorder({ onMemoCreated }: VoiceRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    error,
  } = useVoiceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleStop = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;

    setIsTranscribing(true);
    setLastError(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Transcription failed (${response.status})`);
      }

      const data = await response.json();
      if (data.transcription) {
        toast({ title: "Memo saved", description: "Transcription complete" });
        onMemoCreated?.();
      } else {
        throw new Error("No transcription returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again";
      setLastError(message);
      toast({
        title: "Transcription failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [stopRecording, onMemoCreated]);

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeDisplay = `${mins}:${secs.toString().padStart(2, "0")}`;

  const isIdle = !isRecording && !isTranscribing;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Record New Memo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4">
          {(error || lastError) && (
            <p className="text-sm text-destructive">{error || lastError}</p>
          )}

          {isIdle && (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(to right, #36A7F5, #37CEF5)" }}
              >
                <Mic className="h-8 w-8" />
              </button>
              <p className="text-sm text-muted-foreground">
                Tap to start recording
              </p>
            </>
          )}

          {isRecording && (
            <>
              <div className="relative">
                {!isPaused && (
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(54, 167, 245, 0.2)" }} />
                )}
                <button
                  type="button"
                  onClick={handleStop}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all"
                  style={{ background: "linear-gradient(to right, #36A7F5, #37CEF5)" }}
                >
                  <Square className="h-6 w-6" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`gap-1.5 ${!isPaused ? "animate-pulse text-[#36A7F5]" : ""}`}
                >
                  <span className={`h-2 w-2 rounded-full ${isPaused ? "bg-muted-foreground" : "bg-white"}`} />
                  {isPaused ? "Paused" : "Recording"}
                </Badge>
                <span className="text-lg font-mono font-semibold tabular-nums">
                  {timeDisplay}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!isPaused ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pauseRecording}
                    className="gap-1.5"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resumeRecording}
                    className="gap-1.5"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  Tap the stop button to finish
                </p>
              </div>
            </>
          )}

          {isTranscribing && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Transcribing audio...
              </p>
            </>
          )}
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>Voice memos are transcribed using Groq Whisper AI. Your recording will be saved as a word-for-word transcript with an AI-ready summary of actionable points.</p>
        </div>
      </CardContent>
    </Card>
  );
}
