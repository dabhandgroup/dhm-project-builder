"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gauge } from "lucide-react";
import { toast } from "@/components/ui/toast";

export function AuditFormWrapper() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUrl || !newUrl) return;

    setLoading(true);
    try {
      const res = await fetch("/api/audit/pagespeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUrl, newUrl }),
      });

      if (!res.ok) throw new Error("Audit failed");

      toast({ title: "Audit started", description: "Results will appear shortly" });
      setCurrentUrl("");
      setNewUrl("");
    } catch {
      toast({ title: "Audit failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          New Audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current_url">Current Site URL</Label>
              <Input
                id="current_url"
                type="url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://oldsite.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_url">New Site URL</Label>
              <Input
                id="new_url"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://client.dabhandmarketing.com"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Gauge className="h-4 w-4" />
                Run Audit
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
