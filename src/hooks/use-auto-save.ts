"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UseAutoSaveOptions<S = any> {
  /** Serializable data used for change detection (must not contain File objects etc.) */
  data: unknown;
  /** Actual data passed to onSave — may contain non-serializable objects like Files */
  saveData?: S;
  onSave: (data: S) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
}

export function useAutoSave<S>({
  data,
  saveData,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<S>): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef(JSON.stringify(data));
  const prevDataRef = useRef<string>(initialDataRef.current);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const saveDataRef = useRef(saveData);
  saveDataRef.current = saveData;

  const save = useCallback(async (serialized: string) => {
    setIsSaving(true);
    try {
      // Use saveData if provided, otherwise fall back to data
      const payload = (saveDataRef.current ?? data) as S;
      await onSaveRef.current(payload);
      prevDataRef.current = serialized;
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      save(serialized);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  return { isSaving, lastSaved, isDirty };
}
