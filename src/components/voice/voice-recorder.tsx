"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2 } from "lucide-react";

export function VoiceRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  function startRecording() {
    setState("recording");
    setSeconds(0);
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    setIntervalId(id);
  }

  function stopRecording() {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setState("processing");
    // Simulate processing delay
    setTimeout(() => {
      setState("idle");
      setSeconds(0);
    }, 2000);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeDisplay = `${mins}:${secs.toString().padStart(2, "0")}`;

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
          {state === "idle" && (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
              >
                <Mic className="h-8 w-8" />
              </button>
              <p className="text-sm text-muted-foreground">
                Tap to start recording
              </p>
            </>
          )}

          {state === "recording" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <button
                  type="button"
                  onClick={stopRecording}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all"
                >
                  <Square className="h-6 w-6" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="animate-pulse gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  Recording
                </Badge>
                <span className="text-lg font-mono font-semibold tabular-nums">
                  {timeDisplay}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tap to stop recording
              </p>
            </>
          )}

          {state === "processing" && (
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
          <p>Voice memos are transcribed using Groq Whisper AI. Recordings are saved automatically — they can be linked to a project or kept as standalone notes.</p>
        </div>
      </CardContent>
    </Card>
  );
}
