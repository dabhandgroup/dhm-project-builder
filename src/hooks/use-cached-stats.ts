"use client";

import { useState, useEffect, useRef } from "react";

export function useCachedStats<T>(
  cacheKey: string,
  freshData: T | null
): { data: T | null; isStale: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [isStale, setIsStale] = useState(true);
  const initialized = useRef(false);

  // Read cache on mount (client-side only)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { data: T };
        setData(parsed.data);
        setIsStale(true);
      }
    } catch {
      // Invalid cache, ignore
    }
  }, [cacheKey]);

  // When fresh data arrives, update state and cache
  useEffect(() => {
    if (freshData === null) return;
    setData(freshData);
    setIsStale(false);

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: freshData, ts: Date.now() })
      );
    } catch {
      // Storage full or unavailable
    }
  }, [freshData, cacheKey]);

  return { data, isStale };
}
