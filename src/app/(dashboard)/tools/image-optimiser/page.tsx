"use client";

import { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ImageIcon,
  Upload,
  Download,
  Trash2,
  Loader2,
  Check,
  X,
  FileImage,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

type OutputFormat = "avif" | "webp" | "original";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "done" | "error";
  outputBlob?: Blob;
  outputUrl?: string;
  originalSize: number;
  outputSize?: number;
  outputName?: string;
  originalDimensions?: string;
  outputDimensions?: string;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; description: string }[] = [
  { value: "avif", label: "AVIF", description: "Best compression, modern browsers" },
  { value: "webp", label: "WebP", description: "Great compression, wide support" },
  { value: "original", label: "Original", description: "Keep original format" },
];

const QUALITY_PRESETS = [
  { label: "Web (recommended)", quality: 45, description: "Tiny files, great for web — visually near-identical" },
  { label: "Balanced", quality: 60, description: "Good quality with solid compression" },
  { label: "High", quality: 80, description: "Minimal compression, larger files" },
];

export default function ImageOptimiserPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(45);
  const [maxWidth, setMaxWidth] = useState(2000);
  const [format, setFormat] = useState<OutputFormat>("avif");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArray.length === 0) return;

      const remaining = 100 - images.length;
      const toAdd = fileArray.slice(0, remaining);

      if (fileArray.length > remaining) {
        toast({
          title: "Limit reached",
          description: `Only added ${remaining} of ${fileArray.length} images (max 100)`,
        });
      }

      const newImages: ImageFile[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending",
        originalSize: file.size,
      }));

      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.preview);
        if (img.outputUrl) URL.revokeObjectURL(img.outputUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.preview);
      if (img.outputUrl) URL.revokeObjectURL(img.outputUrl);
    });
    setImages([]);
  }, [images]);

  const processImage = useCallback(
    async (img: ImageFile): Promise<Partial<ImageFile>> => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = image;
          const originalDimensions = `${width}x${height}`;

          // Always resize if wider than maxWidth
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ status: "error" });
            return;
          }

          // Draw image — canvas strips all metadata (EXIF, ICC, etc.)
          ctx.drawImage(image, 0, 0, width, height);

          const outputDimensions = `${width}x${height}`;

          let mimeType: string;
          let ext: string;
          if (format === "avif") {
            mimeType = "image/avif";
            ext = "avif";
          } else if (format === "webp") {
            mimeType = "image/webp";
            ext = "webp";
          } else {
            mimeType = img.file.type;
            ext = img.file.name.split(".").pop() || "png";
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // AVIF may not be supported, fall back to WebP
                if (format === "avif") {
                  canvas.toBlob(
                    (webpBlob) => {
                      if (!webpBlob) {
                        resolve({ status: "error" });
                        return;
                      }
                      const baseName = img.file.name.replace(/\.[^.]+$/, "");
                      const outputUrl = URL.createObjectURL(webpBlob);
                      resolve({
                        status: "done",
                        outputBlob: webpBlob,
                        outputUrl,
                        outputSize: webpBlob.size,
                        outputName: `${baseName}.webp`,
                        originalDimensions,
                        outputDimensions,
                      });
                    },
                    "image/webp",
                    quality / 100
                  );
                  return;
                }
                resolve({ status: "error" });
                return;
              }

              const baseName = img.file.name.replace(/\.[^.]+$/, "");
              const outputName = `${baseName}.${ext}`;
              const outputUrl = URL.createObjectURL(blob);

              resolve({
                status: "done",
                outputBlob: blob,
                outputUrl,
                outputSize: blob.size,
                outputName,
                originalDimensions,
                outputDimensions,
              });
            },
            mimeType,
            quality / 100
          );
        };

        image.onerror = () => resolve({ status: "error" });
        image.src = img.preview;
      });
    },
    [quality, maxWidth, format]
  );

  const processAll = useCallback(async () => {
    const pending = images.filter(
      (img) => img.status === "pending" || img.status === "error"
    );
    if (pending.length === 0) return;

    setIsProcessing(true);

    const batchSize = 4;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);

      setImages((prev) =>
        prev.map((img) =>
          batch.some((b) => b.id === img.id)
            ? { ...img, status: "processing" as const }
            : img
        )
      );

      const results = await Promise.all(batch.map((img) => processImage(img)));

      setImages((prev) =>
        prev.map((img) => {
          const batchIdx = batch.findIndex((b) => b.id === img.id);
          if (batchIdx === -1) return img;
          return { ...img, ...results[batchIdx] };
        })
      );
    }

    setIsProcessing(false);
    toast({
      title: "Optimisation complete",
      description: `${pending.length} images processed`,
    });
  }, [images, processImage]);

  const downloadAll = useCallback(async () => {
    const done = images.filter((img) => img.status === "done" && img.outputBlob);
    if (done.length === 0) return;

    if (done.length === 1) {
      const img = done[0];
      const a = document.createElement("a");
      a.href = img.outputUrl!;
      a.download = img.outputName!;
      a.click();
      return;
    }

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const img of done) {
      zip.file(img.outputName!, img.outputBlob!);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimised-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [images]);

  const downloadSingle = useCallback((img: ImageFile) => {
    if (!img.outputUrl || !img.outputName) return;
    const a = document.createElement("a");
    a.href = img.outputUrl;
    a.download = img.outputName;
    a.click();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
  const totalOutput = images
    .filter((i) => i.outputSize)
    .reduce((s, i) => s + (i.outputSize ?? 0), 0);
  const doneCount = images.filter((i) => i.status === "done").length;
  const savings =
    totalOriginal > 0
      ? Math.round(((totalOriginal - totalOutput) / totalOriginal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Image Optimiser" description="Compress, resize, and convert images to AVIF — all in your browser" />

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Format selector */}
          <div className="space-y-2">
            <Label className="text-sm">Output Format</Label>
            <div className="flex rounded-lg border bg-muted/40 p-1 gap-0.5">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    format === opt.value
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality presets */}
          <div className="space-y-2">
            <Label className="text-sm">Quality</Label>
            <div className="flex rounded-lg border bg-muted/40 p-1 gap-0.5">
              {QUALITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setQuality(preset.quality)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    quality === preset.quality
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                min={10}
                max={100}
                step={5}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                {quality}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-width" className="text-sm">
              Max width (px)
            </Label>
            <Input
              id="max-width"
              type="number"
              value={maxWidth}
              onChange={(e) =>
                setMaxWidth(Math.max(100, parseInt(e.target.value) || 2000))
              }
              min={100}
              max={10000}
              className="w-32 text-base sm:text-sm"
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            Images wider than {maxWidth}px are resized (aspect ratio preserved). All metadata (EXIF, GPS, ICC profiles) is stripped automatically.
          </p>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            Drop images here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, GIF, WebP — up to 100 images
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Actions + Stats */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={processAll}
            disabled={
              isProcessing ||
              images.every((i) => i.status === "done")
            }
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {isProcessing
              ? "Processing..."
              : `Optimise ${images.filter((i) => i.status !== "done").length} Image${images.filter((i) => i.status !== "done").length !== 1 ? "s" : ""}`}
          </Button>
          {doneCount > 0 && (
            <Button variant="outline" onClick={downloadAll} className="gap-2">
              <Download className="h-4 w-4" />
              Download All{doneCount > 1 ? ` (${doneCount})` : ""}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-1.5 text-muted-foreground ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>

          {doneCount > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground w-full sm:w-auto">
              <span>{formatSize(totalOriginal)} original</span>
              <span>&rarr;</span>
              <span>{formatSize(totalOutput)} optimised</span>
              {savings > 0 && (
                <Badge variant="secondary" className="text-green-600 bg-green-50 text-[10px]">
                  -{savings}%
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="grid gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-3 rounded-lg border p-2.5"
            >
              <img
                src={img.outputUrl || img.preview}
                alt={img.file.name}
                className="h-12 w-16 rounded object-cover border shrink-0 bg-muted"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {img.outputName || img.file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatSize(img.originalSize)}</span>
                  {img.outputSize !== undefined && (
                    <>
                      <span>&rarr;</span>
                      <span>{formatSize(img.outputSize)}</span>
                      {img.outputSize < img.originalSize && (
                        <span className="text-green-600">
                          -
                          {Math.round(
                            ((img.originalSize - img.outputSize) /
                              img.originalSize) *
                              100
                          )}
                          %
                        </span>
                      )}
                    </>
                  )}
                </div>
                {img.originalDimensions && img.outputDimensions && img.originalDimensions !== img.outputDimensions && (
                  <p className="text-[10px] text-muted-foreground">
                    {img.originalDimensions} &rarr; {img.outputDimensions}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {img.status === "processing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {img.status === "done" && (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => downloadSingle(img)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                {img.status === "error" && (
                  <X className="h-4 w-4 text-destructive" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeImage(img.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileImage className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No images added yet</p>
          <p className="text-xs mt-1">
            All processing happens in your browser — nothing is uploaded to a server
          </p>
        </div>
      )}
    </div>
  );
}
