"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { FileText, Check, Loader2 } from "lucide-react";
import { updateProject } from "@/actions/projects";

interface BriefEditorProps {
  projectId: string;
  initialBrief: string;
  briefSummary?: string | null;
}

export function BriefEditor({ projectId, initialBrief, briefSummary }: BriefEditorProps) {
  const [brief, setBrief] = useState(initialBrief);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [autoResize]);

  const saveBrief = useCallback(async (value: string) => {
    setSaving(true);
    setSaved(false);
    try {
      await updateProject(projectId, { brief: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  function handleChange(value: string) {
    setBrief(value);
    autoResize();

    // Debounce save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveBrief(value), 1000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Brief
            {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            {saved && <Check className="h-3 w-3 text-green-500" />}
          </CardTitle>
          <CopyButton text={brief} />
        </div>
      </CardHeader>
      <CardContent>
        <textarea
          ref={textareaRef}
          value={brief}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-md border border-input bg-muted/30 p-4 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden break-words"
          placeholder="Enter project brief..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Click to edit. Changes save automatically.
        </p>
        {briefSummary && (
          <div className="mt-4 rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              AI Summary
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {briefSummary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
