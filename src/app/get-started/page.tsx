"use client";

import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageUploadZone } from "@/components/projects/image-upload-zone";
import { compressImageFile } from "@/lib/image-compress";
import { submitOnboarding, uploadOnboardingFile } from "@/actions/onboarding";
import {
  Loader2,
  Plus,
  X,
  CheckCircle2,
  Globe,
} from "lucide-react";

export default function GetStartedPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hasWebsite, setHasWebsite] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [imageryFiles, setImageryFiles] = useState<File[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const competitorInputRef = useRef<HTMLInputElement>(null);

  const addCompetitor = useCallback(() => {
    const url = competitorInput.trim();
    if (!url || competitors.includes(url)) return;
    setCompetitors((prev) => [...prev, url]);
    setCompetitorInput("");
    competitorInputRef.current?.focus();
  }, [competitorInput, competitors]);

  const removeCompetitor = useCallback((url: string) => {
    setCompetitors((prev) => prev.filter((c) => c !== url));
  }, []);

  async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !email || !businessName) return;

    setIsSubmitting(true);

    try {
      // 1. Create client + project
      const result = await submitOnboarding({
        firstName,
        lastName,
        email,
        businessName,
        hasWebsite,
        websiteUrl,
        competitors,
      });

      if (result.error || !result.projectId) {
        alert(result.error || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      const projectId = result.projectId;

      // 2. Upload logo files (skip compression for SVGs)
      for (const file of logoFiles) {
        const base64 = await fileToBase64(file);
        await uploadOnboardingFile(projectId, file.name, base64, file.type, "logo");
      }

      // 3. Compress and upload imagery
      for (const file of imageryFiles) {
        const compressed = await compressImageFile(file);
        const base64 = await fileToBase64(compressed);
        await uploadOnboardingFile(projectId, compressed.name, base64, compressed.type, "imagery");
      }

      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen">
        <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-zinc-950 text-white p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-950 text-sm font-bold">
              DH
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              Dab Hand Marketing
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Build websites faster.<br />
              Manage projects smarter.
            </h1>
            <p className="text-zinc-400 text-[15px] leading-relaxed max-w-sm">
              The internal platform that powers every build — from brief to
              launch, all in one place.
            </p>
          </div>
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Dab Hand Marketing Ltd
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6">
          <div className="text-center space-y-4 max-w-sm">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold tracking-tight">Thank you!</h2>
            <p className="text-muted-foreground">
              We&apos;ve received your brief and will be in touch soon. We&apos;ll review
              everything and get back to you within 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-zinc-950 text-white p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-950 text-sm font-bold">
            DH
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dab Hand Marketing
          </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Let&apos;s build your<br />
            dream website.
          </h1>
          <p className="text-zinc-400 text-[15px] leading-relaxed max-w-sm">
            Fill in the details below and we&apos;ll take it from here.
            The more info you give us, the better the result.
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Dab Hand Marketing Ltd
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 justify-center bg-zinc-50 px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-sm font-bold">
              DH
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              Dab Hand Marketing
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Get Started</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us about your business and what you&apos;re looking for.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
              />
            </div>

            {/* Business name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name *</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="Smith Plumbing Ltd"
              />
            </div>

            {/* Website toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasWebsite">I already have a website</Label>
                <Switch
                  id="hasWebsite"
                  checked={hasWebsite}
                  onCheckedChange={setHasWebsite}
                />
              </div>
              {hasWebsite && (
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">What&apos;s your website?</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="websiteUrl"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Upload your logo</Label>
              <p className="text-xs text-muted-foreground">Preferably SVG. You can upload multiple files.</p>
              <ImageUploadZone
                label="Drop logo files here or click to browse"
                value={logoFiles}
                onChange={setLogoFiles}
                maxFiles={10}
                accept="image/*,.svg"
              />
            </div>

            {/* Imagery upload */}
            <div className="space-y-2">
              <Label>Imagery</Label>
              <p className="text-xs text-muted-foreground">
                Upload photos, branding assets, or inspiration images. They&apos;ll be automatically compressed for web.
              </p>
              <ImageUploadZone
                label="Drop images here or click to browse"
                value={imageryFiles}
                onChange={setImageryFiles}
                maxFiles={50}
              />
            </div>

            {/* Competitor sites */}
            <div className="space-y-3">
              <Label>Competitor sites you like the look of</Label>
              <div className="flex gap-2">
                <Input
                  ref={competitorInputRef}
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCompetitor();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCompetitor}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {competitors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {competitors.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs"
                    >
                      {url.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(url)}
                        className="rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !firstName || !email || !businessName}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Brief"
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Your information is secure and will only be used to create your project.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
