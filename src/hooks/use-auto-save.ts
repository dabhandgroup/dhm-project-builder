"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevDataRef = useRef<string>("");
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const save = useCallback(async (saveData: T, serialized: string) => {
    setIsSaving(true);
    try {
      await onSaveRef.current(saveData);
      prevDataRef.current = serialized;
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      console.error("Auto-save failed:", err);
      // Keep isDirty true so the UI shows unsaved state
      // Don't update prevDataRef so retry is triggered on next change
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);
    if (serialized === prevDataRef.current) return;

    setIsDirty(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(data, serialized);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  return { isSaving, lastSaved, isDirty };
}
