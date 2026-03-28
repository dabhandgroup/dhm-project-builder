"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/shared/copy-button";
import { MessageSquare, Link2 } from "lucide-react";

interface OutreachMessageEditorProps {
  initialMessage: string;
  internalPreviewUrl?: string;
}

export function OutreachMessageEditor({ initialMessage, internalPreviewUrl }: OutreachMessageEditorProps) {
  const [deployUrl, setDeployUrl] = useState("");
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

  // Update the message when deploy URL changes
  useEffect(() => {
    if (!deployUrl.trim()) return;
    // Sanitize: ensure single protocol
    let url = deployUrl.trim();
    url = url.replace(/^(https?:\/\/)+/, "https://");
    if (!url.startsWith("http")) url = `https://${url}`;

    setMessage((prev) => prev.replace(/PREVIEW_URL_PLACEHOLDER/g, url));
  }, [deployUrl]);

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
      <CardContent className="space-y-4">
        {/* Deploy URL field */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Client Preview URL
          </Label>
          <div className="flex gap-2">
            <Input
              value={deployUrl}
              onChange={(e) => setDeployUrl(e.target.value)}
              placeholder="e.g. clientname.dabhandmarketing-demos.com"
              className="text-sm"
            />
            {internalPreviewUrl && (
              <CopyButton text={internalPreviewUrl} label="Internal" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the deployed URL to insert it into the message below.
            {internalPreviewUrl && " Use the Internal button to copy the internal preview link."}
          </p>
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResize();
          }}
          className="w-full rounded-md border border-input bg-muted/30 p-4 text-base sm:text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
        />
        <p className="text-xs text-muted-foreground">
          Edit the message above, then click Copy to clipboard.
        </p>
      </CardContent>
    </Card>
  );
}
