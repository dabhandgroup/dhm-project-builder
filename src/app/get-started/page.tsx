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
  Star,
  MapPin,
  Search,
  MessageSquare,
} from "lucide-react";

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[520px] xl:w-[600px] flex-col justify-between bg-zinc-950 text-white p-10 sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-950 text-sm font-bold">
          DH
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Dab Hand Marketing
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-8 py-10">
        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Let&apos;s build your<br />
            dream website.
          </h1>
          <p className="text-zinc-400 text-[15px] leading-relaxed max-w-md">
            Fill in the details below and we&apos;ll take it from here.
            The more info you give us, the better the result.
          </p>
        </div>

        {/* Google Testimonial */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed italic">
            &ldquo;We are so happy with our website. Daniel really went above and beyond
            &mdash; wouldn&apos;t hesitate to recommend him to anyone.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Hubble Tennis</span>
            <span className="text-zinc-700">&middot;</span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Review
            </span>
          </div>
        </div>

        {/* Google Services */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold">Also available</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                <MapPin className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Google Maps Listing</p>
                <p className="text-xs text-zinc-500">Get your business on Google Maps so customers can find you</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 shrink-0">
                <Search className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Local Search Optimisation</p>
                <p className="text-xs text-zinc-500">Rank higher in local search results and get more traffic</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 shrink-0">
                <MessageSquare className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Google Reviews Management</p>
                <p className="text-xs text-zinc-500">Build trust with automated review collection and responses</p>
              </div>
            </div>
          </div>
          <div className="pt-2 space-y-2">
            <Button
              variant="outline"
              className="w-full bg-white text-zinc-950 hover:bg-zinc-100 border-0 font-semibold"
              size="sm"
            >
              Buy Now &mdash; $199/mo
            </Button>
            <p className="text-[10px] text-center text-zinc-600">No lock-in subscriptions. Cancel anytime.</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} dab hand marketing
      </p>
    </div>
  );
}

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
  const competitorInputRef = useRef<HTMLInputElement>(null);
  const [coolSites, setCoolSites] = useState<string[]>([]);
  const [coolSiteInput, setCoolSiteInput] = useState("");
  const coolSiteInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const addCoolSite = useCallback(() => {
    const url = coolSiteInput.trim();
    if (!url || coolSites.includes(url)) return;
    setCoolSites((prev) => [...prev, url]);
    setCoolSiteInput("");
    coolSiteInputRef.current?.focus();
  }, [coolSiteInput, coolSites]);

  const removeCoolSite = useCallback((url: string) => {
    setCoolSites((prev) => prev.filter((c) => c !== url));
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
      const result = await submitOnboarding({
        firstName,
        lastName,
        email,
        businessName,
        hasWebsite,
        websiteUrl,
        competitors,
        coolSites,
      });

      if (result.error || !result.projectId) {
        alert(result.error || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      const projectId = result.projectId;

      for (const file of logoFiles) {
        const base64 = await fileToBase64(file);
        await uploadOnboardingFile(projectId, file.name, base64, file.type, "logo");
      }

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
        <LeftPanel />
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
      <LeftPanel />

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

            {/* Competitors */}
            <div className="space-y-3">
              <Label>Competitors</Label>
              <div className="flex gap-2">
                <Input
                  ref={competitorInputRef}
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  placeholder="https://competitor.com"
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

            {/* Cool sites */}
            <div className="space-y-3">
              <Label>Cool sites you liked the look of</Label>
              <div className="flex gap-2">
                <Input
                  ref={coolSiteInputRef}
                  value={coolSiteInput}
                  onChange={(e) => setCoolSiteInput(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCoolSite();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCoolSite}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {coolSites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {coolSites.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs"
                    >
                      {url.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
                      <button
                        type="button"
                        onClick={() => removeCoolSite(url)}
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
