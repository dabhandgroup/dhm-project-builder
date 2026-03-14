"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { MessageSquare } from "lucide-react";

interface OutreachMessageEditorProps {
  initialMessage: string;
}

export function OutreachMessageEditor({ initialMessage }: OutreachMessageEditorProps) {
  const [message, setMessage] = useState(initialMessage);

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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full min-h-[160px] rounded-md border border-input bg-muted/30 p-4 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Edit the message above, then click Copy to clipboard.
        </p>
      </CardContent>
    </Card>
  );
}
