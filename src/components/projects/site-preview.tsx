"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
} from "lucide-react";

interface SitePreviewProps {
  projectId: string;
}

const viewports = [
  { key: "desktop", icon: Monitor, width: "100%", label: "Desktop" },
  { key: "tablet", icon: Tablet, width: "768px", label: "Tablet" },
  { key: "mobile", icon: Smartphone, width: "375px", label: "Mobile" },
] as const;

export function SitePreview({ projectId }: SitePreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [expanded, setExpanded] = useState(false);

  const previewUrl = `/preview/${projectId}`;
  const currentViewport = viewports.find((v) => v.key === viewport)!;

  return (
    <Card className={expanded ? "fixed inset-4 z-50 flex flex-col" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Site Preview
          </CardTitle>
          <div className="flex items-center gap-1">
            {/* Viewport toggles */}
            {viewports.map((vp) => (
              <Button
                key={vp.key}
                variant={viewport === vp.key ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewport(vp.key)}
                title={vp.label}
              >
                <vp.icon className="h-3.5 w-3.5" />
              </Button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            {/* Open in new tab */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => window.open(previewUrl, "_blank")}
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            {/* Download */}
            <a href={`/api/projects/download?projectId=${projectId}&type=build`} download>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download ZIP">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </a>
            {/* Expand/collapse */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Minimize" : "Fullscreen"}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={expanded ? "flex-1 pb-4" : ""}>
        <div
          className={`mx-auto transition-all duration-300 ${expanded ? "h-full" : ""}`}
          style={{ maxWidth: currentViewport.width }}
        >
          <div className={`relative rounded-lg border bg-white overflow-hidden ${expanded ? "h-full" : "aspect-[16/10]"}`}>
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Site preview"
            />
          </div>
        </div>
      </CardContent>
      {/* Fullscreen backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setExpanded(false)}
        />
      )}
    </Card>
  );
}
