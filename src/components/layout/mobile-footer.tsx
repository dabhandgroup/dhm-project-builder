"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, FolderKanban, Mic, DollarSign, Settings, Square, Loader2, X, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function MobileFooter() {
  const pathname = usePathname();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  function startRecording() {
    setRecording(true);
    setPaused(false);
    setSeconds(0);
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    setIntervalId(id);
  }

  function pauseRecording() {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setPaused(true);
  }

  function resumeRecording() {
    setPaused(false);
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    setIntervalId(id);
  }

  function stopRecording() {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setRecording(false);
    setPaused(false);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSeconds(0);
    }, 2000);
  }

  function cancelRecording() {
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
    setRecording(false);
    setPaused(false);
    setSeconds(0);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
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
      {recording && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center lg:hidden">
          <div className="bg-background rounded-2xl p-8 mx-4 w-full max-w-sm text-center space-y-6">
            <div className="relative mx-auto w-fit">
              {!paused && (
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={stopRecording}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-white shadow-lg"
              >
                <Square className="h-8 w-8" />
              </button>
            </div>
            <div className="space-y-2">
              <Badge
                variant={paused ? "secondary" : "destructive"}
                className={`gap-1.5 ${!paused ? "animate-pulse" : ""}`}
              >
                <span className={`h-2 w-2 rounded-full ${paused ? "bg-muted-foreground" : "bg-white"}`} />
                {paused ? "Paused" : "Recording"}
              </Badge>
              <p className="text-2xl font-mono font-semibold tabular-nums">{timeDisplay}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              {paused ? (
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
                onClick={cancelRecording}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing toast */}
      {processing && (
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
                  onClick={startRecording}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:bg-red-600 transition-colors">
                    <Mic className="h-6 w-6" />
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
