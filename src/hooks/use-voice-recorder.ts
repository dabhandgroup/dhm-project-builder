"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const IDB_NAME = "voice-memo-buffer";
const IDB_STORE = "chunks";
const IDB_META_KEY = "meta";

// --- IndexedDB helpers ---

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbClear(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Hook ---

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  hasOrphanedRecording: boolean;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  discardRecording: () => void;
  recoverOrphanedRecording: () => Promise<Blob | null>;
  discardOrphanedRecording: () => Promise<void>;
  getCurrentBlob: () => Blob | null;
  error: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasOrphanedRecording, setHasOrphanedRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resolveStopRef = useRef<((blob: Blob | null) => void) | null>(null);
  const chunkIndexRef = useRef(0);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // On mount: check for orphaned chunks from a previous session
  useEffect(() => {
    idbGet<{ mimeType: string; count: number }>(IDB_META_KEY)
      .then((meta) => {
        if (meta && meta.count > 0) setHasOrphanedRecording(true);
      })
      .catch(() => {});
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];
      chunkIndexRef.current = 0;
      setDuration(0);

      // Clear any orphaned data before starting fresh
      await idbClear();
      setHasOrphanedRecording(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });
      mediaRecorderRef.current = mediaRecorder;

      // Store metadata so we know the mimeType on recovery
      await idbPut(IDB_META_KEY, { mimeType, count: 0 });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          const idx = chunkIndexRef.current++;
          // Persist chunk to IndexedDB (fire-and-forget — non-blocking)
          idbPut(`chunk-${idx}`, event.data).catch(() => {});
          idbPut(IDB_META_KEY, { mimeType, count: chunkIndexRef.current }).catch(() => {});
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        stopTimer();
        setIsRecording(false);
        setIsPaused(false);
        // Clear IndexedDB buffer — recording successfully captured
        idbClear().catch(() => {});
        resolveStopRef.current?.(blob);
        resolveStopRef.current = null;
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      startTimer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to access microphone"
      );
    }
  }, [startTimer, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        resolveStopRef.current = resolve;
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        const stream = mediaRecorderRef.current?.stream;
        stream?.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    resolveStopRef.current = null;
    idbClear().catch(() => {});
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
  }, [stopTimer]);

  // Recover orphaned recording from IndexedDB
  const recoverOrphanedRecording = useCallback(async (): Promise<Blob | null> => {
    const meta = await idbGet<{ mimeType: string; count: number }>(IDB_META_KEY);
    if (!meta || meta.count === 0) return null;

    const chunks: Blob[] = [];
    for (let i = 0; i < meta.count; i++) {
      const chunk = await idbGet<Blob>(`chunk-${i}`);
      if (chunk) chunks.push(chunk);
    }

    if (chunks.length === 0) return null;

    const blob = new Blob(chunks, { type: meta.mimeType });
    setAudioBlob(blob);
    await idbClear();
    setHasOrphanedRecording(false);
    return blob;
  }, []);

  const discardOrphanedRecording = useCallback(async (): Promise<void> => {
    await idbClear();
    setHasOrphanedRecording(false);
  }, []);

  // Return current in-progress chunks as a blob (for live partial transcription)
  const getCurrentBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: mimeTypeRef.current });
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopTimer]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
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
  };
}
