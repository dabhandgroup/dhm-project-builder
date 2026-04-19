"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2, Pause, Play, Trash2, RotateCcw } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/toast";

const PARTIAL_INTERVAL_MS = 15_000; // send partial transcription every 15s
const MIN_DURATION_FOR_PARTIAL = 8; // don't send until at least 8s recorded

interface VoiceRecorderProps {
  onMemoCreated?: () => void;
}

export function VoiceRecorder({ onMemoCreated }: VoiceRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    hasOrphanedRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    recoverOrphanedRecording,
    discardOrphanedRecording,
    getCurrentBlob,
    error,
  } = useVoiceRecorder();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [isRecoveringOrSubmitting, setIsRecoveringOrSubmitting] = useState(false);
  const partialPendingRef = useRef(false);

  // Periodic partial transcription while recording
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(async () => {
      if (partialPendingRef.current || duration < MIN_DURATION_FOR_PARTIAL) return;
      const blob = getCurrentBlob();
      if (!blob || blob.size < 4000) return; // skip tiny blobs

      partialPendingRef.current = true;
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        const res = await fetch("/api/transcribe?partial=true", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.transcription) setPartialTranscript(data.transcription);
        }
      } catch {
        // Non-critical — silently skip
      } finally {
        partialPendingRef.current = false;
      }
    }, PARTIAL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, duration, getCurrentBlob]);

  // Clear partial transcript when not recording
  useEffect(() => {
    if (!isRecording) setPartialTranscript("");
  }, [isRecording]);

  const uploadAndSave = useCallback(async (blob: Blob) => {
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
      toast({ title: "Transcription failed", description: message, variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  }, [onMemoCreated]);

  const handleStop = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;
    await uploadAndSave(blob);
  }, [stopRecording, uploadAndSave]);

  const handleRecover = useCallback(async () => {
    setIsRecoveringOrSubmitting(true);
    try {
      const blob = await recoverOrphanedRecording();
      if (!blob) {
        toast({ title: "Nothing to recover", variant: "destructive" });
        return;
      }
      toast({ title: "Recovering recording..." });
      await uploadAndSave(blob);
    } finally {
      setIsRecoveringOrSubmitting(false);
    }
  }, [recoverOrphanedRecording, uploadAndSave]);

  const handleDiscardOrphaned = useCallback(async () => {
    await discardOrphanedRecording();
    toast({ title: "Orphaned recording discarded" });
  }, [discardOrphanedRecording]);

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
        {/* Orphaned recording recovery banner */}
        {hasOrphanedRecording && isIdle && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              A previous recording was interrupted. Recover it?
            </p>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-amber-300 hover:bg-amber-100"
                disabled={isRecoveringOrSubmitting}
                onClick={handleRecover}
              >
                {isRecoveringOrSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Recover
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                disabled={isRecoveringOrSubmitting}
                onClick={handleDiscardOrphaned}
              >
                Discard
              </Button>
            </div>
          </div>
        )}

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
                  <Button variant="outline" size="sm" onClick={pauseRecording} className="gap-1.5">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={resumeRecording} className="gap-1.5">
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscardConfirm(true)}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard
                </Button>
              </div>

              {/* Live transcription preview */}
              {partialTranscript && (
                <div className="w-full rounded-lg border bg-muted/30 p-3 max-h-36 overflow-auto">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Live transcript</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{partialTranscript}</p>
                </div>
              )}
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

        <ConfirmDialog
          open={showDiscardConfirm}
          onOpenChange={setShowDiscardConfirm}
          title="Discard recording"
          description="Are you sure you want to discard this recording? The audio will be lost."
          confirmLabel="Discard"
          onConfirm={() => {
            discardRecording();
            toast({ title: "Recording discarded" });
          }}
        />
      </CardContent>
    </Card>
  );
}
