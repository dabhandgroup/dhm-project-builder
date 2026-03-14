"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { MessageSquare } from "lucide-react";

interface OutreachMessageEditorProps {
  initialMessage: string;
}

export function OutreachMessageEditor({ initialMessage }: OutreachMessageEditorProps) {
  const [message, setMessage] = useState(initialMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [autoResize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Outreach Message
          </span>
          <CopyButton text={message} label="Copy" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResize();
          }}
          className="w-full rounded-md border border-input bg-muted/30 p-4 text-base sm:text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Edit the message above, then click Copy to clipboard.
        </p>
      </CardContent>
    </Card>
  );
}
