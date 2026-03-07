"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploadZoneProps {
  label: string;
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  single?: boolean;
}

export function ImageUploadZone({
  label,
  value,
  onChange,
  maxFiles = 10,
  accept = "image/*",
  className,
  single = false,
}: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Map<File, string>>(new Map());

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const files = Array.from(newFiles);
      const validFiles = files.filter((f) => f.type.startsWith("image/"));

      if (single) {
        const file = validFiles[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setPreviews(new Map([[file, url]]));
          onChange([file]);
        }
        return;
      }

      const available = maxFiles - value.length;
      const toAdd = validFiles.slice(0, available);

      const newPreviews = new Map(previews);
      toAdd.forEach((file) => {
        newPreviews.set(file, URL.createObjectURL(file));
      });
      setPreviews(newPreviews);
      onChange([...value, ...toAdd]);
    },
    [value, onChange, maxFiles, single, previews]
  );

  const removeFile = useCallback(
    (file: File) => {
      const url = previews.get(file);
      if (url) URL.revokeObjectURL(url);
      const newPreviews = new Map(previews);
      newPreviews.delete(file);
      setPreviews(newPreviews);
      onChange(value.filter((f) => f !== file));
    },
    [value, onChange, previews]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <div className={className}>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={!single}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/70">
          {single ? "Click or drag to upload" : `Up to ${maxFiles} files`}
        </p>
      </div>

      {/* Previews */}
      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((file) => {
            const url = previews.get(file);
            return (
              <div
                key={file.name + file.lastModified}
                className="group relative aspect-square rounded-lg border overflow-hidden bg-muted"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
