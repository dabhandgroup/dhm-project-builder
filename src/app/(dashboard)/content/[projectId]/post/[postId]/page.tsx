"use client";

import { useState, useRef, useCallback, use } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Loader2,
  FileText,
  FileDown,
  Image as ImageIcon,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { getContentPlanByProjectId, getProjectById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Safe inline markdown renderer (bold + italic only)
function renderInline(text: string) {
  const parts: (string | React.ReactElement)[] = [];
  // Match **bold** and *italic* patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Mock generated content
const mockPostBody = `## Introduction

In today's competitive digital landscape, having a strong online presence is essential for businesses looking to attract and retain customers. This comprehensive guide covers everything you need to know about establishing your brand's authority in your local market.

## Why This Matters

Local businesses face unique challenges when it comes to digital marketing. Unlike national brands with massive budgets, local businesses need to be strategic about how they allocate their resources. The good news is that with the right approach, you can compete effectively even with a modest budget.

### Key Benefits

- **Increased Visibility**: Appear in local search results when customers are actively looking for your services
- **Trust Building**: Establish credibility through consistent, high-quality content
- **Lead Generation**: Convert website visitors into enquiries and paying customers
- **Long-Term Growth**: Build a sustainable pipeline of organic traffic

## Practical Steps

1. **Optimise Your Google Business Profile** — Ensure all information is accurate and up-to-date
2. **Create Location-Specific Content** — Target the areas you serve with dedicated pages
3. **Build Local Citations** — Get listed in relevant business directories
4. **Encourage Reviews** — Ask satisfied customers to leave Google reviews
5. **Engage on Social Media** — Share your content across platforms your audience uses

## Conclusion

Taking a strategic approach to your online presence doesn't have to be overwhelming. Start with the basics, measure your results, and continuously improve. The businesses that commit to consistent digital marketing efforts are the ones that see the best long-term results.

*If you'd like help implementing any of these strategies, get in touch with our team for a free consultation.*`;

export default function ContentPostPage({
  params,
}: {
  params: Promise<{ projectId: string; postId: string }>;
}) {
  const { projectId, postId } = use(params);
  const plan = getContentPlanByProjectId(projectId);

  if (!plan) notFound();

  const project = getProjectById(plan.project_id);
  const planData = plan.plan_data as { month: string; topic: string; blogTitles?: string[] }[];

  // Parse postId format: "monthIndex-titleIndex"
  const [monthIdx, titleIdx] = postId.split("-").map(Number);
  const monthPlan = planData[monthIdx];
  if (!monthPlan) notFound();

  const postTitle = monthPlan.blogTitles?.[titleIdx] ?? "Untitled Post";

  const [body, setBody] = useState(mockPostBody);
  const [prompt, setPrompt] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metaTitle, setMetaTitle] = useState(postTitle);
  const [metaDescription, setMetaDescription] = useState("");
  const [pagePath, setPagePath] = useState(
    "/" + postTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setFeaturedImage(url);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  }

  function removeImage() {
    setFeaturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRewrite() {
    if (!prompt.trim()) return;
    setIsRewriting(true);
    setTimeout(() => {
      setBody((prev) => prev + `\n\n---\n\n*Updated based on feedback: "${prompt}"*\n\nThe content above has been revised to incorporate your suggestions. Key changes include updated tone, additional detail in the practical steps section, and stronger calls to action throughout.`);
      setPrompt("");
      setIsRewriting(false);
    }, 2500);
  }

  async function handleCopy() {
    try {
      // Copy as rich text (HTML) for pasting into docs
      const html = body
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
        .replace(/\n\n/g, "<br><br>");

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([body], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to plain text
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleGoogleDocs() {
    // In production, this would create a Google Doc via API
    const encoded = encodeURIComponent(postTitle);
    window.open(`https://docs.google.com/document/create?title=${encoded}`, "_blank");
  }

  function handlePDF() {
    // In production, would generate a proper PDF. For now, use print dialog
    window.print();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/content/${projectId}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">{postTitle}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {monthPlan.month} &middot; {project?.title}
          </p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 text-xs"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy Rich Text"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGoogleDocs}
          className="h-8 text-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          Google Docs
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePDF}
          className="h-8 text-xs"
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </Button>
      </div>

      {/* Featured Image */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {featuredImage ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="Featured" className="w-full rounded-lg object-cover aspect-video" />
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2 shadow-md"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center aspect-video gap-2 cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/50"
              )}
            >
              {isDragging ? (
                <>
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-xs font-medium text-primary">Drop image here</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Drag & drop an image or click to upload</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO / Meta Fields */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">SEO & Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Title</Label>
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Page title for search engines..."
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground tabular-nums">{metaTitle.length}/60 characters</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Description</Label>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Brief description for search engine results..."
              rows={2}
            />
            <p className="text-[10px] text-muted-foreground tabular-nums">{metaDescription.length}/160 characters</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Suggested Page Path</Label>
            <Input
              value={pagePath}
              onChange={(e) => setPagePath(e.target.value)}
              placeholder="/your-page-path"
              className="text-sm font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Post Body */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {body.split("\n").map((line, idx) => {
              if (line.startsWith("## ")) return <h2 key={idx} className="text-lg font-bold mt-6 mb-2 first:mt-0">{line.replace("## ", "")}</h2>;
              if (line.startsWith("### ")) return <h3 key={idx} className="text-base font-semibold mt-4 mb-1.5">{line.replace("### ", "")}</h3>;
              if (line.startsWith("- ")) return <li key={idx} className="text-sm leading-relaxed ml-4 mb-1">{renderInline(line.replace("- ", ""))}</li>;
              if (/^\d+\. /.test(line)) return <li key={idx} className="text-sm leading-relaxed ml-4 mb-1 list-decimal">{renderInline(line.replace(/^\d+\. /, ""))}</li>;
              if (line.startsWith("---")) return <hr key={idx} className="my-4" />;
              if (line.trim() === "") return <br key={idx} />;
              return <p key={idx} className="text-sm leading-relaxed mb-2">{renderInline(line)}</p>;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rewrite section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Rewrite / Amend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Describe what changes you&apos;d like and AI will rewrite the post
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Make the tone more professional, add a section about pricing, shorten the introduction..."
              rows={3}
            />
          </div>
          <Button
            onClick={handleRewrite}
            disabled={isRewriting || !prompt.trim()}
            className="w-full sm:w-auto"
          >
            {isRewriting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Rewrite Post
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
