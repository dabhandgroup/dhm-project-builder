"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Loader2, X, Pause, Play, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { toast } from "@/components/ui/toast";

export function DesktopVoiceWidget() {
  const router = useRouter();
  const {
    isRecording,
    isPaused,
    duration,
    startRecording: startRec,
    pauseRecording,
    resumeRecording,
    stopRecording: stopRec,
    error,
  } = useVoiceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleStartRecording = useCallback(async () => {
    setIsOpen(true);
    setIsMinimized(false);
    await startRec();
  }, [startRec]);

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRec();
    if (!blob) return;

    setIsTranscribing(true);
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
        router.push("/voice-memos");
        router.refresh();
      } else {
        throw new Error("No transcription returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again";
      toast({
        title: "Transcription failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setIsOpen(false);
    }
  }, [stopRec, router]);

  const handleCancel = useCallback(async () => {
    await stopRec();
    setIsOpen(false);
    setIsMinimized(false);
  }, [stopRec]);

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeDisplay = `${mins}:${secs.toString().padStart(2, "0")}`;

  // Minimized badge — shows during recording when minimized
  if (isMinimized && isRecording) {
    return (
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-background border shadow-lg px-4 py-2.5 hover:shadow-xl transition-shadow"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-mono font-medium tabular-nums">{timeDisplay}</span>
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Transcribing state
  if (isTranscribing) {
    return (
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <div className="flex items-center gap-3 rounded-2xl bg-background border shadow-xl px-5 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm">Transcribing...</span>
        </div>
      </div>
    );
  }

  // Open recording panel
  if (isOpen && isRecording) {
    return (
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <div className="w-72 rounded-2xl bg-background border shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {!isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                )}
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isPaused ? "bg-muted-foreground" : "bg-red-500"
                )} />
              </span>
              <span className="text-xs font-medium">
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
                title="Minimize"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 text-center space-y-4">
            <p className="text-3xl font-mono font-semibold tabular-nums">{timeDisplay}</p>

            <div className="flex items-center justify-center gap-3">
              {isPaused ? (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  title="Resume"
                >
                  <Play className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleStopRecording}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: "linear-gradient(to right, #36A7F5, #37CEF5)" }}
                title="Stop and save"
              >
                <Square className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                title="Discard"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: floating mic button
  return (
    <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
      <button
        type="button"
        onClick={handleStartRecording}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        style={{ background: "linear-gradient(to right, #36A7F5, #37CEF5)" }}
        title="Record voice memo"
      >
        <Mic className="h-6 w-6" />
      </button>
    </div>
  );
}
