"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Pause, Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface MicButtonProps {
  onTranscription: (text: string) => void;
  onSummary?: (summary: string) => void;
  fieldName?: string;
  projectId?: string;
  className?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MicButton({
  onTranscription,
  onSummary,
  fieldName,
  projectId,
  className,
}: MicButtonProps) {
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

  const handleStop = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      if (fieldName) formData.append("fieldName", fieldName);
      if (projectId) formData.append("projectId", projectId);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      onTranscription(data.transcription);
      if (data.summary && onSummary) {
        onSummary(data.summary);
      }
      toast({ title: "Transcription complete" });
    } catch {
      toast({
        title: "Transcription failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [stopRecording, onTranscription, onSummary, fieldName, projectId]);

  if (error) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("text-destructive", className)}
        onClick={startRecording}
        aria-label="Microphone error - click to retry"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  if (isTranscribing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        className={className}
        aria-label="Transcribing"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!isRecording) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={startRecording}
        className={cn("text-muted-foreground hover:text-foreground", className)}
        aria-label="Start recording"
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="text-xs font-mono text-muted-foreground min-w-[3ch]">
        {formatDuration(duration)}
      </span>
      {isPaused ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={resumeRecording}
          className="h-7 w-7"
          aria-label="Resume recording"
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={pauseRecording}
          className="h-7 w-7"
          aria-label="Pause recording"
        >
          <Pause className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleStop}
        className="h-7 w-7 text-destructive"
        aria-label="Stop recording"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
      </Button>
    </div>
  );
}
