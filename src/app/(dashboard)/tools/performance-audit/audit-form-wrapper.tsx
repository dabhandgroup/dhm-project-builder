"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Gauge, FileDown, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/toast";

export function AuditFormWrapper() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUrl || !newUrl) return;

    setLoading(true);
    // Mock: simulate audit
    await new Promise((r) => setTimeout(r, 1500));
    toast({ title: "Audit started", description: "Results will appear shortly" });
    setCurrentUrl("");
    setNewUrl("");
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            New Performance Audit
          </CardTitle>
          <CardDescription>
            Compare website speeds using GTmetrix and Google PageSpeed Insights.
            PDF reports are generated for each audit to share with clients.
          </CardDescription>
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
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_url">New Site URL (your build)</Label>
                <Input
                  id="new_url"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://client.dabhandmarketing.com"
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
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
              <p className="text-xs text-muted-foreground">
                Runs both GTmetrix and Google PageSpeed Insights APIs
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data sources info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <a href="https://pagespeed.web.dev/" target="_blank" rel="noopener noreferrer" className="block">
          <Card className="border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
            <CardContent className="p-4 sm:p-4 flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2 shrink-0">
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Google PageSpeed Insights</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Core Web Vitals, performance score, LCP, CLS, FID metrics. PDF report auto-generated.
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="https://gtmetrix.com/" target="_blank" rel="noopener noreferrer" className="block">
          <Card className="border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors cursor-pointer">
            <CardContent className="p-4 sm:p-4 flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2 shrink-0">
                <FileDown className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">GTmetrix Report</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Full performance report with waterfall chart. Downloadable PDF for client presentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  );
}
