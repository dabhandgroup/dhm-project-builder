"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Upload,
  Check,
  AlertCircle,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface FirecrawlImportData {
  metadata: {
    title?: string;
    description?: string;
    ogDescription?: string;
    ogTitle?: string;
    ogImage?: string;
    "og:image"?: string;
    "og:description"?: string;
    "og:title"?: string;
    favicon?: string;
    sourceURL?: string;
    url?: string;
    [key: string]: unknown;
  };
  images?: string[];
}

export interface FirecrawlImportResult {
  domain: string;
  title: string;
  description: string;
  ogImage: string;
  favicon: string;
  images: string[];
  rawMetadata: Record<string, unknown>;
}

interface FirecrawlImportProps {
  onImport: (result: FirecrawlImportResult) => void;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function parseFirecrawlJson(json: unknown): FirecrawlImportResult {
  const obj = json as Record<string, unknown>;

  // Handle both { data: { metadata, images } } and { metadata, images } shapes
  const data = (obj.data ?? obj) as FirecrawlImportData;
  const meta = data.metadata ?? {};
  const images = data.images ?? [];

  const sourceUrl =
    (meta.sourceURL as string) || (meta.url as string) || "";
  const domain = sourceUrl ? extractDomain(sourceUrl) : "";

  const title =
    (meta.ogTitle as string) ||
    (meta["og:title"] as string) ||
    (meta.title as string) ||
    "";

  const description =
    (meta.ogDescription as string) ||
    (meta["og:description"] as string) ||
    (meta.description as string) ||
    "";

  const ogImage =
    (meta.ogImage as string) ||
    (meta["og:image"] as string) ||
    "";

  const favicon = (meta.favicon as string) || "";

  return {
    domain,
    title,
    description,
    ogImage,
    favicon,
    images: images as string[],
    rawMetadata: meta as Record<string, unknown>,
  };
}

export function FirecrawlImport({ onImport }: FirecrawlImportProps) {
  const [imported, setImported] = useState<FirecrawlImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          const result = parseFirecrawlJson(json);
          if (!result.domain && !result.title && result.images.length === 0) {
            setError("Could not find any useful data in this file. Make sure it's a Firecrawl export.");
            return;
          }
          setImported(result);
          onImport(result);
        } catch {
          setError("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    },
    [onImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".json")) {
        handleFile(file);
      } else {
        setError("Please drop a .json file");
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = useCallback(() => {
    setImported(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  if (imported) {
    return (
      <Card className="border-orange-500/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Firecrawl Import
            <Badge variant="secondary" className="ml-auto text-green-600 bg-green-50">
              <Check className="h-3 w-3 mr-1" />
              Imported
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {imported.domain && (
              <div>
                <p className="text-xs text-muted-foreground">Domain</p>
                <p className="font-medium truncate">{imported.domain}</p>
              </div>
            )}
            {imported.title && (
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="font-medium truncate">{imported.title}</p>
              </div>
            )}
          </div>

          {imported.description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm line-clamp-2">{imported.description}</p>
            </div>
          )}

          {/* OG Image preview */}
          {imported.ogImage && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">OG Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imported.ogImage}
                alt="Open Graph"
                className="rounded-lg border w-full max-h-40 object-cover"
              />
            </div>
          )}

          {/* Images list */}
          {imported.images.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowImages(!showImages)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {showImages ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <ImageIcon className="h-3.5 w-3.5" />
                {imported.images.length} images found
              </button>
              {showImages && (
                <div className="mt-2 rounded-lg border bg-muted/30 p-3 max-h-[300px] overflow-auto space-y-1">
                  {imported.images.map((url) => (
                    <div key={url} className="flex items-center gap-2 text-xs group">
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">
                        {url}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 text-xs">
              <X className="h-3 w-3" />
              Clear Import
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Import from Firecrawl
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
            isDragging
              ? "border-orange-500 bg-orange-50/50"
              : "hover:border-muted-foreground/30"
          }`}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Drop a Firecrawl JSON file here or click to upload
          </p>
          <p className="text-xs text-muted-foreground">
            Auto-fills domain, description, and images
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive mt-3">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
