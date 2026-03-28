export interface FaviconVariant {
  name: string;
  blob: Blob;
  width: number;
  height: number;
}

const FAVICON_SIZES = [
  { name: "favicon-16x16.png", width: 16, height: 16 },
  { name: "favicon-32x32.png", width: 32, height: 32 },
  { name: "apple-touch-icon.png", width: 180, height: 180 },
  { name: "android-chrome-192x192.png", width: 192, height: 192 },
  { name: "android-chrome-512x512.png", width: 512, height: 512 },
];

function resizeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/png",
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export async function generateFaviconVariants(
  file: File,
): Promise<FaviconVariant[]> {
  const img = await loadImage(file);
  const variants: FaviconVariant[] = [];

  for (const size of FAVICON_SIZES) {
    const blob = await resizeImage(img, size.width, size.height);
    variants.push({
      name: size.name,
      blob,
      width: size.width,
      height: size.height,
    });
  }

  URL.revokeObjectURL(img.src);
  return variants;
}
