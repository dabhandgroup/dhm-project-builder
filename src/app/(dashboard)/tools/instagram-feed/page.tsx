"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Instagram, Copy, Plus, Trash2, Code, ExternalLink } from "lucide-react";

interface EmbedEntry {
  id: string;
  clientName: string;
  appId: string;
}

const STORAGE_KEY = "dhm-instagram-embeds";

function loadEmbeds(): EmbedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEmbeds(embeds: EmbedEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(embeds));
}

function generateEmbed(appId: string): string {
  return `<!-- Elfsight Instagram Feed -->\n<script src="https://elfsightcdn.com/platform.js" async></script>\n<div class="elfsight-app-${appId}" data-elfsight-app-lazy></div>`;
}

export default function InstagramFeedPage() {
  const [embeds, setEmbeds] = useState<EmbedEntry[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [newAppId, setNewAppId] = useState("");

  useEffect(() => {
    setEmbeds(loadEmbeds());
  }, []);

  const addEmbed = useCallback(() => {
    const appId = newAppId.trim();
    const clientName = newClientName.trim();
    if (!appId || !clientName) return;

    const entry: EmbedEntry = {
      id: Math.random().toString(36).slice(2),
      clientName,
      appId,
    };
    const updated = [...embeds, entry];
    setEmbeds(updated);
    saveEmbeds(updated);
    setNewClientName("");
    setNewAppId("");
    toast({ title: "Embed added" });
  }, [embeds, newAppId, newClientName]);

  const removeEmbed = useCallback((id: string) => {
    const updated = embeds.filter((e) => e.id !== id);
    setEmbeds(updated);
    saveEmbeds(updated);
    toast({ title: "Embed removed" });
  }, [embeds]);

  const copyCode = useCallback((appId: string) => {
    navigator.clipboard.writeText(generateEmbed(appId));
    toast({ title: "Copied to clipboard" });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Feed"
        description="Manage Elfsight Instagram feed embeds for client websites"
      />

      {/* Add new embed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Embed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client / Site Name</Label>
              <Input
                id="clientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. Elk Building"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appId">Elfsight App ID</Label>
              <Input
                id="appId"
                value={newAppId}
                onChange={(e) => setNewAppId(e.target.value)}
                placeholder="e.g. f120685d-6c8e-44a6-8442-de1f6adfb2fa"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmbed();
                  }
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Find the App ID in your{" "}
            <a
              href="https://dash.elfsight.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Elfsight dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
            {" "}&mdash; it&apos;s the UUID in the embed code after <code className="text-xs bg-muted px-1 rounded">elfsight-app-</code>
          </p>
          <Button
            onClick={addEmbed}
            disabled={!newClientName.trim() || !newAppId.trim()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Embed
          </Button>
        </CardContent>
      </Card>

      {/* Saved embeds */}
      {embeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Saved Embeds ({embeds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {embeds.map((embed) => (
                <div key={embed.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{embed.clientName}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {embed.appId}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCode(embed.appId)}
                        className="gap-1.5 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmbed(embed.id)}
                        className="text-xs hover:text-destructive hover:border-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        Embed Code
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                      {generateEmbed(embed.appId)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {embeds.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <Instagram className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No embeds saved yet</p>
              <p className="text-xs text-muted-foreground">
                Add your first Elfsight Instagram feed embed above
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
