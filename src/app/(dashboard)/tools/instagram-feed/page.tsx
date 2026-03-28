"use client";

import { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Instagram,
  Copy,
  Plus,
  Trash2,
  Code,
  Palette,
  Grid3X3,
  Loader2,
  Settings2,
  Eye,
  RefreshCw,
  LayoutGrid,
  GalleryHorizontal,
  Rows3,
  Check,
} from "lucide-react";

// --- Types ---

type LayoutType = "grid" | "slider" | "carousel";

interface InstagramPost {
  id: string;
  shortcode: string;
  imageUrl: string;
  caption: string;
  link: string;
  isVideo: boolean;
}

interface WidgetConfig {
  id: string;
  clientName: string;
  username: string;
  postCount: number;
  columns: number;
  gap: number;
  borderRadius: number;
  showCaption: boolean;
  bgColor: string;
  hoverEffect: boolean;
  layout: LayoutType;
  photosOnly: boolean;
  showHeader: boolean;
  // Fetched data (baked into embed)
  posts?: InstagramPost[];
  profilePicUrl?: string;
  fullName?: string;
  fetchedAt?: number;
}

const DEFAULT_CONFIG: Omit<WidgetConfig, "id" | "clientName" | "username"> = {
  postCount: 6,
  columns: 3,
  gap: 8,
  borderRadius: 8,
  showCaption: false,
  bgColor: "#ffffff",
  hoverEffect: true,
  layout: "grid",
  photosOnly: true,
  showHeader: true,
};

const STORAGE_KEY = "dhm-instagram-widgets";

function loadWidgets(): WidgetConfig[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveWidgets(widgets: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

// --- Embed Code Generator ---

function generateEmbedCode(config: WidgetConfig): string {
  const widgetId = `dhm-ig-${config.username.replace(/[^a-z0-9]/gi, "")}`;
  const posts = (config.posts || []).slice(0, config.postCount);

  if (posts.length === 0) {
    return `<!-- DHM Instagram Feed Widget — ${config.clientName} -->\n<!-- No posts loaded. Refresh the widget to fetch posts. -->`;
  }

  // Build header HTML
  const headerHtml = config.showHeader
    ? `<div class="dhm-ig-header">
    ${config.profilePicUrl ? `<img src="${config.profilePicUrl}" alt="${config.username}"/>` : ""}
    <a href="https://www.instagram.com/${config.username}/" target="_blank" rel="noopener">@${config.username}</a>
  </div>`
    : "";

  // Build posts HTML
  const postsHtml = posts
    .map(
      (p) =>
        `<div class="dhm-ig-item">
      <a href="${p.link}" target="_blank" rel="noopener">
        <img src="${p.imageUrl}" alt="${p.caption ? p.caption.substring(0, 80) : "Instagram post"}" loading="lazy"/>
        <div class="dhm-ig-overlay"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></div>
      </a>${config.showCaption && p.caption ? `\n      <div class="dhm-ig-caption">${p.caption.substring(0, 100)}</div>` : ""}
    </div>`,
    )
    .join("\n    ");

  const hoverCss = config.hoverEffect
    ? `#${widgetId} .dhm-ig-item:hover{transform:scale(1.03);z-index:1}#${widgetId} .dhm-ig-item:hover .dhm-ig-overlay{opacity:1}`
    : "";

  const captionCss = config.showCaption
    ? `#${widgetId} .dhm-ig-caption{padding:8px;font-size:13px;color:#262626;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`
    : "";

  if (config.layout === "grid") {
    return `<!-- DHM Instagram Feed Widget — ${config.clientName} -->
<div id="${widgetId}">
  <style>
    #${widgetId}{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:${config.bgColor};max-width:100%}
    #${widgetId} .dhm-ig-grid{display:grid;grid-template-columns:repeat(${config.columns},1fr);gap:${config.gap}px}
    #${widgetId} .dhm-ig-item{position:relative;overflow:hidden;border-radius:${config.borderRadius}px;transition:transform .2s;aspect-ratio:1}
    #${widgetId} .dhm-ig-item img{width:100%;height:100%;object-fit:cover;display:block}
    #${widgetId} .dhm-ig-item a{display:block;width:100%;height:100%}
    #${widgetId} .dhm-ig-overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
    #${widgetId} .dhm-ig-overlay svg{width:28px;height:28px;color:#fff;fill:#fff}
    ${hoverCss}
    ${captionCss}
    #${widgetId} .dhm-ig-header{display:flex;align-items:center;gap:10px;padding:12px 0;margin-bottom:8px}
    #${widgetId} .dhm-ig-header img{width:36px;height:36px;border-radius:50%}
    #${widgetId} .dhm-ig-header a{font-weight:600;font-size:14px;color:#262626;text-decoration:none}
    #${widgetId} .dhm-ig-header a:hover{color:#0095f6}
    @media(max-width:640px){#${widgetId} .dhm-ig-grid{grid-template-columns:repeat(2,1fr)}}
  </style>
  ${headerHtml}
  <div class="dhm-ig-grid">
    ${postsHtml}
  </div>
</div>`;
  }

  if (config.layout === "slider") {
    return `<!-- DHM Instagram Feed Widget — ${config.clientName} -->
<div id="${widgetId}">
  <style>
    #${widgetId}{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:${config.bgColor};max-width:100%;position:relative}
    #${widgetId} .dhm-ig-slider{display:flex;gap:${config.gap}px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}
    #${widgetId} .dhm-ig-slider::-webkit-scrollbar{display:none}
    #${widgetId} .dhm-ig-item{flex:0 0 calc(${100 / config.columns}% - ${config.gap * (config.columns - 1) / config.columns}px);scroll-snap-align:start;position:relative;overflow:hidden;border-radius:${config.borderRadius}px;transition:transform .2s;aspect-ratio:1}
    #${widgetId} .dhm-ig-item img{width:100%;height:100%;object-fit:cover;display:block}
    #${widgetId} .dhm-ig-item a{display:block;width:100%;height:100%}
    #${widgetId} .dhm-ig-overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
    #${widgetId} .dhm-ig-overlay svg{width:28px;height:28px;color:#fff;fill:#fff}
    ${hoverCss}
    ${captionCss}
    #${widgetId} .dhm-ig-header{display:flex;align-items:center;gap:10px;padding:12px 0;margin-bottom:8px}
    #${widgetId} .dhm-ig-header img{width:36px;height:36px;border-radius:50%}
    #${widgetId} .dhm-ig-header a{font-weight:600;font-size:14px;color:#262626;text-decoration:none}
    #${widgetId} .dhm-ig-header a:hover{color:#0095f6}
    #${widgetId} .dhm-ig-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.9);border:1px solid #ddd;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    #${widgetId} .dhm-ig-nav:hover{background:#fff}
    #${widgetId} .dhm-ig-prev{left:4px}
    #${widgetId} .dhm-ig-next{right:4px}
    @media(max-width:640px){#${widgetId} .dhm-ig-item{flex:0 0 calc(50% - ${config.gap / 2}px)}}
  </style>
  ${headerHtml}
  <div style="position:relative">
    <div class="dhm-ig-slider" id="${widgetId}-track">
      ${postsHtml}
    </div>
    <button class="dhm-ig-nav dhm-ig-prev" onclick="document.getElementById('${widgetId}-track').scrollBy({left:-300,behavior:'smooth'})" aria-label="Previous">&lsaquo;</button>
    <button class="dhm-ig-nav dhm-ig-next" onclick="document.getElementById('${widgetId}-track').scrollBy({left:300,behavior:'smooth'})" aria-label="Next">&rsaquo;</button>
  </div>
</div>`;
  }

  // Carousel layout
  return `<!-- DHM Instagram Feed Widget — ${config.clientName} -->
<div id="${widgetId}">
  <style>
    #${widgetId}{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:${config.bgColor};max-width:100%;position:relative}
    #${widgetId} .dhm-ig-carousel{position:relative;overflow:hidden;border-radius:${config.borderRadius}px;aspect-ratio:1}
    #${widgetId} .dhm-ig-slide{position:absolute;inset:0;opacity:0;transition:opacity .5s}
    #${widgetId} .dhm-ig-slide.active{opacity:1}
    #${widgetId} .dhm-ig-slide img{width:100%;height:100%;object-fit:cover;display:block}
    #${widgetId} .dhm-ig-slide a{display:block;width:100%;height:100%}
    #${widgetId} .dhm-ig-overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
    #${widgetId} .dhm-ig-overlay svg{width:28px;height:28px;color:#fff;fill:#fff}
    ${hoverCss}
    ${captionCss}
    #${widgetId} .dhm-ig-header{display:flex;align-items:center;gap:10px;padding:12px 0;margin-bottom:8px}
    #${widgetId} .dhm-ig-header img{width:36px;height:36px;border-radius:50%}
    #${widgetId} .dhm-ig-header a{font-weight:600;font-size:14px;color:#262626;text-decoration:none}
    #${widgetId} .dhm-ig-header a:hover{color:#0095f6}
    #${widgetId} .dhm-ig-dots{display:flex;justify-content:center;gap:6px;padding:12px 0}
    #${widgetId} .dhm-ig-dot{width:8px;height:8px;border-radius:50%;background:#ccc;border:none;cursor:pointer;padding:0;transition:background .2s}
    #${widgetId} .dhm-ig-dot.active{background:#262626}
    #${widgetId} .dhm-ig-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.9);border:1px solid #ddd;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    #${widgetId} .dhm-ig-nav:hover{background:#fff}
    #${widgetId} .dhm-ig-prev{left:8px}
    #${widgetId} .dhm-ig-next{right:8px}
  </style>
  ${headerHtml}
  <div class="dhm-ig-carousel" id="${widgetId}-carousel">
    ${posts.map((p, i) => `<div class="dhm-ig-slide${i === 0 ? " active" : ""}">
      <a href="${p.link}" target="_blank" rel="noopener">
        <img src="${p.imageUrl}" alt="${p.caption ? p.caption.substring(0, 80) : "Instagram post"}" loading="lazy"/>
        <div class="dhm-ig-overlay"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></div>
      </a>${config.showCaption && p.caption ? `\n      <div class="dhm-ig-caption" style="position:absolute;bottom:0;left:0;right:0;background:rgba(255,255,255,.9);padding:10px">${p.caption.substring(0, 100)}</div>` : ""}
    </div>`).join("\n    ")}
    <button class="dhm-ig-nav dhm-ig-prev" aria-label="Previous">&lsaquo;</button>
    <button class="dhm-ig-nav dhm-ig-next" aria-label="Next">&rsaquo;</button>
  </div>
  <div class="dhm-ig-dots" id="${widgetId}-dots">
    ${posts.map((_, i) => `<button class="dhm-ig-dot${i === 0 ? " active" : ""}" aria-label="Slide ${i + 1}"></button>`).join("")}
  </div>
</div>
<script>
(function(){
  var current=0,total=${posts.length};
  var carousel=document.getElementById("${widgetId}-carousel");
  var dots=document.getElementById("${widgetId}-dots");
  function go(n){
    var slides=carousel.querySelectorAll(".dhm-ig-slide");
    var btns=dots.querySelectorAll(".dhm-ig-dot");
    slides[current].classList.remove("active");
    btns[current].classList.remove("active");
    current=((n%total)+total)%total;
    slides[current].classList.add("active");
    btns[current].classList.add("active");
  }
  carousel.querySelector(".dhm-ig-prev").onclick=function(){go(current-1)};
  carousel.querySelector(".dhm-ig-next").onclick=function(){go(current+1)};
  dots.querySelectorAll(".dhm-ig-dot").forEach(function(b,i){b.onclick=function(){go(i)}});
  setInterval(function(){go(current+1)},4000);
})();
</script>`;
}

// --- Component ---

export default function InstagramFeedPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [username, setUsername] = useState("");
  const [clientName, setClientName] = useState("");
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setWidgets(loadWidgets());
  }, []);

  const fetchPosts = async (user: string): Promise<{
    posts: InstagramPost[];
    profilePicUrl: string;
    fullName: string;
  } | null> => {
    try {
      const res = await fetch(`/api/instagram?username=${encodeURIComponent(user)}`);
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error || "Failed to fetch Instagram data", variant: "destructive" });
        return null;
      }
      const data = await res.json();
      return {
        posts: data.posts || [],
        profilePicUrl: data.profilePicUrl || "",
        fullName: data.fullName || user,
      };
    } catch {
      toast({ title: "Failed to connect to Instagram", variant: "destructive" });
      return null;
    }
  };

  const addWidget = useCallback(async () => {
    const user = username.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    const name = clientName.trim();
    if (!user || !name) return;

    setFetching(true);
    const result = await fetchPosts(user);
    setFetching(false);

    if (!result) return;

    let posts = result.posts;
    if (config.photosOnly) {
      posts = posts.filter((p) => !p.isVideo);
    }

    const widget: WidgetConfig = {
      ...config,
      id: Math.random().toString(36).slice(2),
      clientName: name,
      username: user,
      posts: posts.slice(0, config.postCount),
      profilePicUrl: result.profilePicUrl,
      fullName: result.fullName,
      fetchedAt: Date.now(),
    };
    const updated = [...widgets, widget];
    setWidgets(updated);
    saveWidgets(updated);
    setUsername("");
    setClientName("");
    setConfig(DEFAULT_CONFIG);
    toast({ title: `Widget created with ${widget.posts?.length || 0} posts` });
  }, [widgets, username, clientName, config]);

  const refreshWidget = useCallback(async (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    setFetching(true);
    const result = await fetchPosts(widget.username);
    setFetching(false);

    if (!result) return;

    let posts = result.posts;
    if (widget.photosOnly) {
      posts = posts.filter((p) => !p.isVideo);
    }

    const updated = widgets.map((w) =>
      w.id === widgetId
        ? {
            ...w,
            posts: posts.slice(0, w.postCount),
            profilePicUrl: result.profilePicUrl,
            fullName: result.fullName,
            fetchedAt: Date.now(),
          }
        : w,
    );
    setWidgets(updated);
    saveWidgets(updated);
    toast({ title: "Widget refreshed with latest posts" });
  }, [widgets]);

  const removeWidget = useCallback((id: string) => {
    const updated = widgets.filter((w) => w.id !== id);
    setWidgets(updated);
    saveWidgets(updated);
    toast({ title: "Widget removed" });
  }, [widgets]);

  const copyCode = useCallback((widget: WidgetConfig) => {
    navigator.clipboard.writeText(generateEmbedCode(widget));
    toast({ title: "Embed code copied to clipboard" });
  }, []);

  const showPreview = useCallback((widget: WidgetConfig) => {
    setPreviewCode(generateEmbedCode(widget));
  }, []);

  const layoutOptions: { value: LayoutType; label: string; icon: React.ReactNode }[] = [
    { value: "grid", label: "Grid", icon: <LayoutGrid className="h-4 w-4" /> },
    { value: "slider", label: "Slider", icon: <GalleryHorizontal className="h-4 w-4" /> },
    { value: "carousel", label: "Carousel", icon: <Rows3 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Feed Widget"
        description="Generate custom Instagram feed widgets for client websites — no Elfsight needed"
      />

      {/* Create new widget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Widget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client / Site Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Elk Building"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Instagram Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. elkbuilding"
              />
            </div>
          </div>

          {/* Layout selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <LayoutGrid className="h-3 w-3" />
              Layout
            </p>
            <div className="flex gap-2">
              {layoutOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConfig({ ...config, layout: opt.value })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    config.layout === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout options */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Settings2 className="h-3 w-3" />
              Settings
            </p>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="postCount" className="text-xs">Number of Posts</Label>
                <Input
                  id="postCount"
                  type="number"
                  min={1}
                  max={12}
                  value={config.postCount}
                  onChange={(e) => setConfig({ ...config, postCount: Number(e.target.value) })}
                />
              </div>
              {config.layout !== "carousel" && (
                <div className="space-y-1.5">
                  <Label htmlFor="columns" className="text-xs">Columns</Label>
                  <Input
                    id="columns"
                    type="number"
                    min={1}
                    max={6}
                    value={config.columns}
                    onChange={(e) => setConfig({ ...config, columns: Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="gap" className="text-xs">Gap (px)</Label>
                <Input
                  id="gap"
                  type="number"
                  min={0}
                  max={32}
                  value={config.gap}
                  onChange={(e) => setConfig({ ...config, gap: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="borderRadius" className="text-xs">Border Radius (px)</Label>
                <Input
                  id="borderRadius"
                  type="number"
                  min={0}
                  max={32}
                  value={config.borderRadius}
                  onChange={(e) => setConfig({ ...config, borderRadius: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Style options */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Palette className="h-3 w-3" />
              Style & Filters
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bgColor" className="text-xs">Background Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="bgColor"
                    value={config.bgColor}
                    onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                    className="h-8 w-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={config.bgColor}
                    onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                    className="w-28 text-xs font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-5">
                <input
                  type="checkbox"
                  checked={config.showCaption}
                  onChange={(e) => setConfig({ ...config, showCaption: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Show captions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer pt-5">
                <input
                  type="checkbox"
                  checked={config.hoverEffect}
                  onChange={(e) => setConfig({ ...config, hoverEffect: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Hover effect</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer pt-5">
                <input
                  type="checkbox"
                  checked={config.photosOnly}
                  onChange={(e) => setConfig({ ...config, photosOnly: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Photos only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer pt-5">
                <input
                  type="checkbox"
                  checked={config.showHeader}
                  onChange={(e) => setConfig({ ...config, showHeader: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Show header</span>
              </label>
            </div>
          </div>

          <Button
            onClick={addWidget}
            disabled={!clientName.trim() || !username.trim() || fetching}
            className="gap-2"
          >
            {fetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching Posts...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Widget
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Saved widgets */}
      {widgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Saved Widgets ({widgets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {widgets.map((widget) => (
                <div key={widget.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{widget.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        @{widget.username} &middot; {widget.posts?.length || 0} posts &middot;{" "}
                        {widget.layout} &middot; {widget.columns} cols
                        {widget.fetchedAt && (
                          <> &middot; fetched {new Date(widget.fetchedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshWidget(widget.id)}
                        disabled={fetching}
                        className="gap-1.5 text-xs"
                      >
                        {fetching ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showPreview(widget)}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCode(widget)}
                        className="gap-1.5 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedWidget(expandedWidget === widget.id ? null : widget.id)}
                        className="gap-1.5 text-xs"
                      >
                        <Code className="h-3 w-3" />
                        Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWidget(widget.id)}
                        className="text-xs hover:text-destructive hover:border-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick preview thumbnails */}
                  {widget.posts && widget.posts.length > 0 && (
                    <div className="flex gap-1.5 overflow-hidden">
                      {widget.posts.slice(0, 6).map((post) => (
                        <div
                          key={post.id}
                          className="w-14 h-14 rounded overflow-hidden shrink-0 bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expanded code view */}
                  {expandedWidget === widget.id && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          Embed Code
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(widget)}
                          className="h-6 text-[10px] gap-1"
                        >
                          <Copy className="h-2.5 w-2.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                        {generateEmbedCode(widget)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview modal */}
      {previewCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewCode(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Widget Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewCode(null)}>Close</Button>
            </div>
            <div className="border rounded-lg p-4">
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px">${previewCode}</body></html>`}
                className="w-full border-0"
                style={{ minHeight: 500 }}
                sandbox="allow-scripts"
                title="Instagram feed preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {widgets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <Grid3X3 className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No widgets created yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first custom Instagram feed widget above
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter the Instagram username and configure layout, style, and filters</li>
            <li>Click &quot;Create Widget&quot; — posts are fetched and baked into the embed code</li>
            <li>Copy the embed code and paste it into the client&apos;s website HTML</li>
            <li>Use &quot;Refresh&quot; to update with latest posts when needed</li>
          </ol>
          <div className="rounded-md bg-muted/50 p-3 mt-3">
            <p className="text-xs font-medium mb-1">Features:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>3 layouts: Grid, Slider (scrollable), and Carousel (auto-advance)</li>
              <li>Photos-only filter to exclude video posts</li>
              <li>Show/hide header with profile picture</li>
              <li>No monthly subscription, no third-party branding</li>
              <li>Self-contained embed — no external JS dependencies</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
