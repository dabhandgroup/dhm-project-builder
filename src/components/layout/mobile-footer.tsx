"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { LayoutDashboard, FolderKanban, Mic, DollarSign, Settings, Square, Loader2, X, Pause, Play, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { toast } from "@/components/ui/toast";

export function MobileFooter() {
  const pathname = usePathname();
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleStartRecording = useCallback(async () => {
    setShowCancelConfirm(false);
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
        // Navigate to voice memos page so user can see/copy the result
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
    }
  }, [stopRec, router]);

  function confirmCancel() {
    setShowCancelConfirm(true);
  }

  const cancelRecording = useCallback(async () => {
    await stopRec(); // stop and discard
    setShowCancelConfirm(false);
  }, [stopRec]);

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeDisplay = `${mins}:${secs.toString().padStart(2, "0")}`;

  const items = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Record", href: "#mic", icon: Mic, isMic: true },
    { label: "Financials", href: "/financials", icon: DollarSign },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Recording overlay */}
      {isRecording && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center lg:hidden">
          <div className="bg-background rounded-2xl p-8 mx-4 w-full max-w-sm text-center space-y-6">
            <div className="relative mx-auto w-fit">
              {!isPaused && (
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ animationDuration: "2s", background: "rgba(54, 167, 245, 0.2)" }} />
              )}
              <button
                type="button"
                onClick={handleStopRecording}
                className="relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg"
                style={{ background: "linear-gradient(to right, #36A7F5, #37CEF5)" }}
              >
                <Square className="h-8 w-8" />
              </button>
            </div>
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className={`gap-1.5 ${!isPaused ? "text-[#36A7F5]" : ""}`}
                style={!isPaused ? { animation: "pulse 2s ease-in-out infinite" } : undefined}
              >
                <span className={`h-2 w-2 rounded-full ${isPaused ? "bg-muted-foreground" : "bg-white"}`} />
                {isPaused ? "Paused" : "Recording"}
              </Badge>
              <p className="text-2xl font-mono font-semibold tabular-nums">{timeDisplay}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              {isPaused ? (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={confirmCancel}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Cancel confirmation */}
            {showCancelConfirm && (
              <div className="mt-4 rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Discard recording?
                </div>
                <p className="text-xs text-muted-foreground">Your recording will be lost and cannot be recovered.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={cancelRecording}
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Keep Recording
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing toast */}
      {isTranscribing && (
        <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden">
          <div className="flex items-center gap-3 rounded-lg bg-background border shadow-lg px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm">Transcribing audio...</span>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
        <nav className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            if (item.isMic) {
              return (
                <button
                  key="mic"
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isRecording || isTranscribing}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-colors",
                    (isRecording || isTranscribing) && "opacity-50"
                  )} style={{ background: "linear-gradient(to right, #36A7F5, #37CEF5)" }}>
                    {isTranscribing ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground">Record</span>
                </button>
              );
            }

            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </footer>
    </>
  );
}
