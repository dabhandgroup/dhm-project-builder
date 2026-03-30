"use client";

import { useState, useRef, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Upload,
  Download,
  ImageIcon,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface GeneratedIcon {
  name: string;
  width: number;
  height: number;
  blob: Blob;
  preview: string;
  description: string;
}

const ICON_SIZES = [
  { name: "favicon.ico", width: 48, height: 48, description: "Browser tab (ICO)" },
  { name: "icon.png", width: 32, height: 32, description: "Small browser icon" },
  { name: "icon-192.png", width: 192, height: 192, description: "Android home screen" },
  { name: "icon-512.png", width: 512, height: 512, description: "Android splash / PWA" },
  { name: "apple-icon.png", width: 180, height: 180, description: "Apple touch icon" },
  { name: "opengraph-image.png", width: 1200, height: 630, description: "Social share (OG)" },
  { name: "icon-16.png", width: 16, height: 16, description: "Tiny favicon" },
  { name: "icon-96.png", width: 96, height: 96, description: "Google TV / shortcuts" },
  { name: "icon-384.png", width: 384, height: 384, description: "PWA manifest" },
];

function resizeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  isOg: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  if (isOg) {
    // OG image: center the icon on a white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    const iconSize = Math.min(width, height) * 0.4;
    const x = (width - iconSize) / 2;
    const y = (height - iconSize) / 2;
    ctx.drawImage(img, x, y, iconSize, iconSize);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }

  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      type,
      1.0,
    );
  });
}

// Generate a minimal ICO file from a canvas (single 48x48 PNG image)
async function canvasToIco(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await canvasToBlob(canvas, "image/png");
  const pngBuf = new Uint8Array(await pngBlob.arrayBuffer());

  // ICO header: 6 bytes
  const header = new ArrayBuffer(6);
  const headerView = new DataView(header);
  headerView.setUint16(0, 0, true); // reserved
  headerView.setUint16(2, 1, true); // type: 1 = ICO
  headerView.setUint16(4, 1, true); // number of images

  // Directory entry: 16 bytes
  const entry = new ArrayBuffer(16);
  const entryView = new DataView(entry);
  entryView.setUint8(0, canvas.width >= 256 ? 0 : canvas.width);
  entryView.setUint8(1, canvas.height >= 256 ? 0 : canvas.height);
  entryView.setUint8(2, 0); // color palette
  entryView.setUint8(3, 0); // reserved
  entryView.setUint16(4, 1, true); // color planes
  entryView.setUint16(6, 32, true); // bits per pixel
  entryView.setUint32(8, pngBuf.length, true); // image size
  entryView.setUint32(12, 6 + 16, true); // offset to image data

  return new Blob([header, entry, pngBuf], { type: "image/x-icon" });
}

export default function FaviconGeneratorPage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [icons, setIcons] = useState<GeneratedIcon[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    setSourceFile(file);
    setIcons([]);
    const reader = new FileReader();
    reader.onload = (e) => setSourceImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  async function generateIcons() {
    if (!sourceImage) return;
    setGenerating(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = sourceImage;
      });
      imgRef.current = img;

      const generated: GeneratedIcon[] = [];

      for (const size of ICON_SIZES) {
        const isOg = size.name === "opengraph-image.png";
        const canvas = resizeImage(img, size.width, size.height, isOg);

        let blob: Blob;
        if (size.name === "favicon.ico") {
          blob = await canvasToIco(canvas);
        } else {
          blob = await canvasToBlob(canvas);
        }

        generated.push({
          name: size.name,
          width: size.width,
          height: size.height,
          blob,
          preview: URL.createObjectURL(blob),
          description: size.description,
        });
      }

      setIcons(generated);
      toast({ title: `Generated ${generated.length} favicon sizes` });
    } catch {
      toast({ title: "Failed to generate icons", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function downloadIcon(icon: GeneratedIcon) {
    const a = document.createElement("a");
    a.href = icon.preview;
    a.download = icon.name;
    a.click();
  }

  async function downloadAll() {
    // Use JSZip if available, otherwise download individually
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const appFolder = zip.folder("app")!;

      for (const icon of icons) {
        appFolder.file(icon.name, icon.blob);
      }

      // Add manifest.json
      const manifest = {
        name: sourceFile?.name.replace(/\.\w+$/, "") || "My App",
        short_name: sourceFile?.name.replace(/\.\w+$/, "") || "App",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-384.png", sizes: "384x384", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      };
      appFolder.file("manifest.json", JSON.stringify(manifest, null, 2));

      // Add instructions
      const readme = [
        "# Favicon Files for Next.js",
        "",
        "## App Router (Next.js 13+)",
        "Place these files in your `app/` directory:",
        "",
        ...icons.map((i) => `- \`${i.name}\` — ${i.description} (${i.width}x${i.height})`),
        "- `manifest.json` — PWA manifest",
        "",
        "## File Placement",
        "```",
        "app/",
        "  favicon.ico",
        "  icon.png",
        "  apple-icon.png",
        "  opengraph-image.png",
        "  manifest.json",
        "  icon-16.png",
        "  icon-96.png",
        "  icon-192.png",
        "  icon-384.png",
        "  icon-512.png",
        "```",
        "",
        "Next.js automatically generates the correct `<link>` and `<meta>` tags",
        "from these files when placed in the `app/` directory.",
      ].join("\n");
      zip.file("README.txt", readme);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "favicons.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: download one by one
      for (const icon of icons) {
        downloadIcon(icon);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  function clearAll() {
    for (const icon of icons) URL.revokeObjectURL(icon.preview);
    setSourceImage(null);
    setSourceFile(null);
    setIcons([]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favicon Generator"
        description="Upload a square image and generate all favicon sizes needed for Next.js"
      />

      {/* Upload */}
      <Card>
        <CardContent className="pt-6">
          {!sourceImage ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-sm">Drop your image here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, or SVG. Ideally 512x512 or larger, square.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourceImage}
                  alt="Source"
                  className="h-20 w-20 rounded-lg border object-contain bg-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{sourceFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sourceFile && `${(sourceFile.size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={generateIcons}
                    disabled={generating}
                    className="gap-1"
                  >
                    {generating ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                    ) : icons.length > 0 ? (
                      <><Check className="h-3.5 w-3.5" /> Regenerate</>
                    ) : (
                      <><ImageIcon className="h-3.5 w-3.5" /> Generate Favicons</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated icons */}
      {icons.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Generated {icons.length} files</p>
                <p className="text-xs text-muted-foreground">
                  Place these in your Next.js <code className="bg-muted px-1 rounded">app/</code> directory
                </p>
              </div>
              <Button size="sm" onClick={downloadAll} className="gap-1">
                <Download className="h-3.5 w-3.5" />
                Download All (ZIP)
              </Button>
            </div>

            <div className="grid gap-2">
              {icons.map((icon) => (
                <div
                  key={icon.name}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded border bg-white flex items-center justify-center shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={icon.preview}
                      alt={icon.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium">{icon.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {icon.width}x{icon.height} &middot; {icon.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(icon.blob.size / 1024).toFixed(1)} KB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadIcon(icon)}
                    className="h-7 w-7 p-0 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Usage instructions */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-xs font-medium">Next.js App Router usage:</p>
              <pre className="text-xs text-muted-foreground font-mono leading-relaxed">{`app/
  favicon.ico          # Browser tab
  icon.png             # Default icon
  apple-icon.png       # iOS/Safari
  opengraph-image.png  # Social sharing
  manifest.json        # PWA manifest`}</pre>
              <p className="text-xs text-muted-foreground">
                Next.js auto-generates the correct meta tags from these files.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
