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
} from "lucide-react";

// --- Types ---

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
}

const DEFAULT_CONFIG: Omit<WidgetConfig, "id" | "clientName" | "username"> = {
  postCount: 6,
  columns: 3,
  gap: 8,
  borderRadius: 8,
  showCaption: false,
  bgColor: "#ffffff",
  hoverEffect: true,
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
  const hoverCss = config.hoverEffect
    ? `#${widgetId} .dhm-ig-item:hover{transform:scale(1.03);z-index:1}#${widgetId} .dhm-ig-item:hover .dhm-ig-overlay{opacity:1}`
    : "";

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
    ${config.showCaption ? `#${widgetId} .dhm-ig-caption{padding:8px;font-size:13px;color:#262626;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}` : ""}
    #${widgetId} .dhm-ig-header{display:flex;align-items:center;gap:10px;padding:12px 0;margin-bottom:8px}
    #${widgetId} .dhm-ig-header img{width:36px;height:36px;border-radius:50%}
    #${widgetId} .dhm-ig-header a{font-weight:600;font-size:14px;color:#262626;text-decoration:none}
    #${widgetId} .dhm-ig-header a:hover{color:#0095f6}
    #${widgetId} .dhm-ig-loading{text-align:center;padding:40px;color:#8e8e8e;font-size:14px}
    #${widgetId} .dhm-ig-error{text-align:center;padding:40px;color:#ed4956;font-size:14px}
    @media(max-width:640px){#${widgetId} .dhm-ig-grid{grid-template-columns:repeat(2,1fr)}}
  </style>
  <div class="dhm-ig-loading">Loading Instagram feed…</div>
</div>
<script>
(function(){
  var el=document.getElementById("${widgetId}");
  var username="${config.username}";
  var count=${config.postCount};
  var showCaption=${config.showCaption};

  fetch("https://www.instagram.com/api/v1/users/web_profile_info/?username.="+username,{headers:{"x-ig-app-id":"936619743392459"}})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
    .then(function(d){
      var user=d.data.user;
      var edges=user.edge_owner_to_timeline_media.edges.slice(0,count);
      var pic=user.profile_pic_url;
      var html='<div class="dhm-ig-header"><img src="'+pic+'" alt="'+username+'"/><a href="https://www.instagram.com/'+username+'/" target="_blank" rel="noopener">@'+username+'</a></div>';
      html+='<div class="dhm-ig-grid">';
      edges.forEach(function(e){
        var node=e.node;
        var src=node.thumbnail_src||node.display_url;
        var link="https://www.instagram.com/p/"+node.shortcode+"/";
        var cap=node.edge_media_to_caption.edges[0]?node.edge_media_to_caption.edges[0].node.text:"";
        html+='<div class="dhm-ig-item">';
        html+='<a href="'+link+'" target="_blank" rel="noopener">';
        html+='<img src="'+src+'" alt="Instagram post" loading="lazy"/>';
        html+='<div class="dhm-ig-overlay"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></div>';
        html+='</a>';
        if(showCaption&&cap)html+='<div class="dhm-ig-caption">'+cap.substring(0,100)+'</div>';
        html+='</div>';
      });
      html+='</div>';
      el.innerHTML=html;
    })
    .catch(function(){
      el.innerHTML='<div class="dhm-ig-grid">';
      for(var i=0;i<count;i++){
        el.innerHTML+='<div class="dhm-ig-item" style="background:#f0f0f0"></div>';
      }
      el.innerHTML+='</div><p style="text-align:center;margin-top:12px"><a href="https://www.instagram.com/'+username+'/" target="_blank" rel="noopener" style="color:#0095f6;font-size:14px;text-decoration:none">Follow @'+username+' on Instagram</a></p>';
    });
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

  useEffect(() => {
    setWidgets(loadWidgets());
  }, []);

  const addWidget = useCallback(() => {
    const user = username.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    const name = clientName.trim();
    if (!user || !name) return;

    const widget: WidgetConfig = {
      ...config,
      id: Math.random().toString(36).slice(2),
      clientName: name,
      username: user,
    };
    const updated = [...widgets, widget];
    setWidgets(updated);
    saveWidgets(updated);
    setUsername("");
    setClientName("");
    setConfig(DEFAULT_CONFIG);
    toast({ title: "Widget created" });
  }, [widgets, username, clientName, config]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Feed Widget"
        description="Generate custom, self-hosted Instagram feed widgets for client websites — no Elfsight subscription needed"
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

          {/* Layout options */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Settings2 className="h-3 w-3" />
              Layout Settings
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
              Style Settings
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
                <span className="text-sm">Hover zoom effect</span>
              </label>
            </div>
          </div>

          <Button
            onClick={addWidget}
            disabled={!clientName.trim() || !username.trim()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Widget
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
                        @{widget.username} &middot; {widget.postCount} posts &middot; {widget.columns} cols
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                style={{ minHeight: 400 }}
                sandbox="allow-scripts"
                title="Instagram feed preview"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Preview may be limited due to Instagram&apos;s rate limiting. The widget will work on the client&apos;s domain.
            </p>
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
                Create your first custom Instagram feed widget above — no Elfsight subscription required
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
            <li>Enter the Instagram username and configure the widget appearance</li>
            <li>Click &quot;Create Widget&quot; to generate the embed code</li>
            <li>Copy the embed code and paste it into the client&apos;s website HTML</li>
            <li>The widget fetches Instagram posts directly and displays them in a responsive grid</li>
          </ol>
          <div className="rounded-md bg-muted/50 p-3 mt-3">
            <p className="text-xs font-medium mb-1">Benefits over Elfsight:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>No monthly subscription ($0 vs $5-15+/mo per widget)</li>
              <li>No third-party branding or &quot;powered by&quot; badge</li>
              <li>Self-contained — no external JS dependencies to slow down the site</li>
              <li>Customisable layout, colours, and hover effects</li>
              <li>Falls back gracefully with a link to the Instagram profile</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
