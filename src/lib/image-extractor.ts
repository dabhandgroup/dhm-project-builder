/**
 * Extract images from HTML content by parsing <img> tags,
 * resolving URLs, and downloading them.
 */

interface ExtractedImage {
  filename: string;
  buffer: Buffer;
  originalUrl: string;
}

const MAX_IMAGES_PER_PAGE = 30;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const DOWNLOAD_TIMEOUT = 8000; // 8s per image
const CONCURRENCY = 5;

// Common tracking pixel / placeholder patterns to skip
const SKIP_PATTERNS = [
  /1x1/,
  /pixel\./,
  /tracking/i,
  /beacon/i,
  /\.gif$/i,
  /spacer/i,
  /blank\./i,
  /data:image\/svg/,
];

function sanitizeFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    let name = segments[segments.length - 1] || "image";

    // Remove query-like fragments from filename
    name = name.split("?")[0].split("#")[0];

    // Sanitize
    name = name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Ensure it has an extension
    if (!/\.\w{2,5}$/.test(name)) {
      name += ".png";
    }

    return name;
  } catch {
    return "image.png";
  }
}

function deduplicateFilenames(filenames: string[]): string[] {
  const counts = new Map<string, number>();
  return filenames.map((name) => {
    const count = counts.get(name) || 0;
    counts.set(name, count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf(".");
    if (dot > 0) {
      return `${name.slice(0, dot)}-${count}${name.slice(dot)}`;
    }
    return `${name}-${count}`;
  });
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) return null;

    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength > MAX_IMAGE_SIZE) return null;
    if (arrayBuf.byteLength < 100) return null; // Skip tiny files (tracking pixels)

    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

// Process items with a concurrency limit
async function processWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function extractPageImages(
  html: string,
  pageUrl: string,
): Promise<ExtractedImage[]> {
  if (!html) return [];

  // Extract img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const srcSet = new Set<string>();
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src) continue;

    // Skip data URIs and inline SVGs
    if (src.startsWith("data:")) continue;

    // Skip tracking pixels and common junk
    if (SKIP_PATTERNS.some((p) => p.test(src))) continue;

    // Resolve relative URLs
    try {
      const resolved = new URL(src, pageUrl).href;
      srcSet.add(resolved);
    } catch {
      // Skip invalid URLs
    }
  }

  // Also extract from srcset attributes
  const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    const srcset = match[1];
    // srcset format: "url 1x, url 2x" or "url 300w, url 600w"
    const entries = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]);
    for (const src of entries) {
      if (!src || src.startsWith("data:")) continue;
      try {
        srcSet.add(new URL(src, pageUrl).href);
      } catch {
        // Skip
      }
    }
  }

  const urls = Array.from(srcSet).slice(0, MAX_IMAGES_PER_PAGE);
  if (urls.length === 0) return [];

  // Prepare filenames
  const rawFilenames = urls.map(sanitizeFilename);
  const filenames = deduplicateFilenames(rawFilenames);

  // Download with concurrency limit
  const buffers = await processWithConcurrency(urls, CONCURRENCY, downloadImage);

  const results: ExtractedImage[] = [];
  for (let i = 0; i < urls.length; i++) {
    const buf = buffers[i];
    if (buf) {
      results.push({
        filename: filenames[i],
        buffer: buf,
        originalUrl: urls[i],
      });
    }
  }

  return results;
}
