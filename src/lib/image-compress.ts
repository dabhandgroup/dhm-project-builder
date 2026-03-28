/**
 * Client-side image compression utilities.
 * Used by both the Image Optimiser tool and the onboarding form.
 */

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  q: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, q));
}

export async function compressToTarget(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  startWidth: number,
  startHeight: number,
  mimeType: string,
  startQuality: number,
  targetBytes: number
): Promise<{ blob: Blob; finalWidth: number; finalHeight: number } | null> {
  let q = startQuality;
  let w = startWidth;
  let h = startHeight;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, w, h);

  // Phase 1: reduce quality
  let blob = await canvasToBlob(canvas, mimeType, q);
  while (blob && blob.size > targetBytes && q > 0.1) {
    q = Math.round((q - 0.05) * 100) / 100;
    blob = await canvasToBlob(canvas, mimeType, q);
  }

  // Phase 2: scale down dimensions if still too big
  const minW = Math.round(startWidth * 0.3);
  while (blob && blob.size > targetBytes && w > minW) {
    w = Math.round(w * 0.8);
    h = Math.round(h * 0.8);
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return null;
    ctx2.drawImage(image, 0, 0, w, h);

    q = startQuality;
    blob = await canvasToBlob(canvas, mimeType, q);
    while (blob && blob.size > targetBytes && q > 0.1) {
      q = Math.round((q - 0.05) * 100) / 100;
      blob = await canvasToBlob(canvas, mimeType, q);
    }
  }

  if (!blob) return null;
  return { blob, finalWidth: w, finalHeight: h };
}

/**
 * Compress a File to WebP under a target size.
 * Returns a new File with .webp extension.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1600,
  targetKB = 300,
  quality = 0.4
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip SVGs — they're already tiny
    if (file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement("canvas");
      let { width, height } = image;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      const result = await compressToTarget(
        canvas,
        image,
        width,
        height,
        "image/webp",
        quality,
        targetKB * 1024
      );

      if (!result) {
        resolve(file); // fallback to original
        return;
      }

      const baseName = file.name.replace(/\.[^.]+$/, "");
      resolve(new File([result.blob], `${baseName}.webp`, { type: "image/webp" }));
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = URL.createObjectURL(file);
  });
}
