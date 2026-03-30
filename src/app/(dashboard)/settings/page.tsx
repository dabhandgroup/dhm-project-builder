"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { toast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  Camera,
  Github,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  Bot,
  Flame,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { updateProfile } from "@/actions/users";
import { updatePassword } from "@/actions/auth";
import { saveSettings, loadSettings } from "@/actions/settings";
import { uploadAvatar } from "@/lib/storage";
import {
  testGithubConnection,
  testVercelConnection,
  testNetlifyConnection,
  testFirecrawlConnection,
  testAnthropicConnection,
} from "@/actions/integrations";

function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
  if (connected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Connected</p>
          {label && <p className="text-xs text-muted-foreground">{label}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3">
      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Not configured</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile } = useUser();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Integration state
  const [githubPat, setGithubPat] = useState("");
  const [githubOrg, setGithubOrg] = useState("dabhandgroup");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [savingGithub, setSavingGithub] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);

  const [vercelToken, setVercelToken] = useState("");
  const [vercelTeamId, setVercelTeamId] = useState("");
  const [savingVercel, setSavingVercel] = useState(false);
  const [testingVercel, setTestingVercel] = useState(false);

  const [netlifyToken, setNetlifyToken] = useState("");
  const [savingNetlify, setSavingNetlify] = useState(false);
  const [testingNetlify, setTestingNetlify] = useState(false);

  const [anthropicKey, setAnthropicKey] = useState("");
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [savingApiKeys, setSavingApiKeys] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [testingFirecrawl, setTestingFirecrawl] = useState(false);

  const [globalPrompt, setGlobalPrompt] = useState("");
  const [savingGlobalPrompt, setSavingGlobalPrompt] = useState(false);

  // Track which integrations have been verified (saved + loaded from DB)
  const [connectedServices, setConnectedServices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings().then((settings) => {
      if (settings.github_pat) setGithubPat(settings.github_pat);
      if (settings.github_org) setGithubOrg(settings.github_org);
      if (settings.github_default_branch) setDefaultBranch(settings.github_default_branch);
      if (settings.vercel_token) setVercelToken(settings.vercel_token);
      if (settings.vercel_team_id) setVercelTeamId(settings.vercel_team_id);
      if (settings.netlify_token) setNetlifyToken(settings.netlify_token);
      if (settings.anthropic_api_key) setAnthropicKey(settings.anthropic_api_key);
      if (settings.firecrawl_api_key) setFirecrawlKey(settings.firecrawl_api_key);
      if (settings.global_prompt) setGlobalPrompt(settings.global_prompt);

      // Mark services as connected if they have saved keys
      setConnectedServices({
        github: !!settings.github_pat,
        vercel: !!settings.vercel_token,
        netlify: !!settings.netlify_token,
        anthropic: !!settings.anthropic_api_key,
        firecrawl: !!settings.firecrawl_api_key,
      });
    }).catch(() => {});
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
      await updateProfile(user.id, { avatar_url: url });
      toast({ title: "Profile photo updated" });
    } catch {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    }
  }

  const initials = (profile?.full_name || fullName || "DH")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    const result = await updateProfile(user.id, { full_name: fullName });
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    const formData = new FormData();
    formData.set("password", newPassword);
    formData.set("confirmPassword", confirmPassword);
    const result = await updatePassword(formData);
    if (result?.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  }

  // --- GitHub ---
  async function handleSaveGithub() {
    setSavingGithub(true);
    const result = await saveSettings({
      github_pat: githubPat,
      github_org: githubOrg,
      github_default_branch: defaultBranch,
    });
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "GitHub settings saved" });
      setConnectedServices((prev) => ({ ...prev, github: !!githubPat }));
    }
    setSavingGithub(false);
  }

  async function handleTestGithub() {
    if (!githubPat) {
      toast({ title: "Enter a PAT first", variant: "destructive" });
      return;
    }
    setTestingGithub(true);
    const result = await testGithubConnection(githubPat);
    if (result.valid) {
      toast({ title: `Connected as ${(result as { login?: string }).login}` });
    } else {
      toast({ title: result.error || "Connection failed", variant: "destructive" });
    }
    setTestingGithub(false);
  }

  // --- Vercel ---
  async function handleSaveVercel() {
    setSavingVercel(true);
    const result = await saveSettings({
      vercel_token: vercelToken,
      vercel_team_id: vercelTeamId,
    });
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "Vercel settings saved" });
      setConnectedServices((prev) => ({ ...prev, vercel: !!vercelToken }));
    }
    setSavingVercel(false);
  }

  async function handleTestVercel() {
    if (!vercelToken) {
      toast({ title: "Enter a token first", variant: "destructive" });
      return;
    }
    setTestingVercel(true);
    const result = await testVercelConnection(vercelToken);
    if (result.valid) {
      toast({ title: `Connected as ${(result as { username?: string }).username}` });
    } else {
      toast({ title: result.error || "Connection failed", variant: "destructive" });
    }
    setTestingVercel(false);
  }

  // --- Netlify ---
  async function handleSaveNetlify() {
    setSavingNetlify(true);
    const result = await saveSettings({
      netlify_token: netlifyToken,
    });
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "Netlify settings saved" });
      setConnectedServices((prev) => ({ ...prev, netlify: !!netlifyToken }));
    }
    setSavingNetlify(false);
  }

  async function handleTestNetlify() {
    if (!netlifyToken) {
      toast({ title: "Enter a token first", variant: "destructive" });
      return;
    }
    setTestingNetlify(true);
    const result = await testNetlifyConnection(netlifyToken);
    if (result.valid) {
      toast({ title: `Connected as ${(result as { name?: string }).name}` });
    } else {
      toast({ title: result.error || "Connection failed", variant: "destructive" });
    }
    setTestingNetlify(false);
  }

  // --- API Keys ---
  async function handleSaveApiKeys() {
    setSavingApiKeys(true);
    const result = await saveSettings({
      anthropic_api_key: anthropicKey,
      firecrawl_api_key: firecrawlKey,
    });
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "API keys saved" });
      setConnectedServices((prev) => ({
        ...prev,
        anthropic: !!anthropicKey,
        firecrawl: !!firecrawlKey,
      }));
    }
    setSavingApiKeys(false);
  }

  async function handleTestAnthropic() {
    if (!anthropicKey) {
      toast({ title: "Enter an API key first", variant: "destructive" });
      return;
    }
    setTestingAnthropic(true);
    const result = await testAnthropicConnection(anthropicKey);
    if (result.valid) {
      toast({ title: "Anthropic API key is valid" });
    } else {
      toast({ title: result.error || "Connection failed", variant: "destructive" });
    }
    setTestingAnthropic(false);
  }

  async function handleTestFirecrawl() {
    if (!firecrawlKey) {
      toast({ title: "Enter an API key first", variant: "destructive" });
      return;
    }
    setTestingFirecrawl(true);
    const result = await testFirecrawlConnection(firecrawlKey);
    if (result.valid) {
      toast({ title: "Firecrawl API key is valid" });
    } else {
      toast({ title: result.error || "Connection failed", variant: "destructive" });
    }
    setTestingFirecrawl(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile and integrations" />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.full_name || "Set your name"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary hover:underline mt-1"
              >
                Change photo
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPasswordSettings">Confirm Password</Label>
            <Input
              id="confirmPasswordSettings"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} size="sm">
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Global Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Global Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This text is injected at the top of every AI prompt generated for projects. Use it to set consistent instructions for Claude — e.g. output format, tech stack preferences, or export requirements.
          </p>
          <Textarea
            value={globalPrompt}
            onChange={(e) => setGlobalPrompt(e.target.value)}
            placeholder="e.g. When complete, run export as HTML. Give me a link on GitHub that I can download as a zip folder with all the HTML files (not as Next.js)..."
            rows={5}
            className="text-sm font-mono"
          />
          <Button
            size="sm"
            onClick={async () => {
              setSavingGlobalPrompt(true);
              const result = await saveSettings({ global_prompt: globalPrompt });
              if (result.error) {
                toast({ title: result.error, variant: "destructive" });
              } else {
                toast({ title: "Global prompt saved" });
              }
              setSavingGlobalPrompt(false);
            }}
            disabled={savingGlobalPrompt}
          >
            {savingGlobalPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Global Prompt
          </Button>
        </CardContent>
      </Card>

      {/* GitHub Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add your GitHub Personal Access Token to enable repository creation and code management for client projects.
          </p>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=DHM+Project+Builder"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Create a new GitHub Personal Access Token
          </a>
          <StatusBadge connected={!!connectedServices.github} label={connectedServices.github ? `Organisation: @${githubOrg}` : undefined} />
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">GitHub Personal Access Token</Label>
              <Input type="password" value={githubPat} onChange={(e) => setGithubPat(e.target.value)} placeholder="ghp_..." className="text-sm font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">GitHub Organisation / Account</Label>
              <Input value={githubOrg} onChange={(e) => setGithubOrg(e.target.value)} placeholder="e.g. dabhandgroup" className="text-sm" />
              <p className="text-[10px] text-muted-foreground">Repositories will be created under this organisation</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Default Branch</Label>
              <Input value={defaultBranch} onChange={(e) => setDefaultBranch(e.target.value)} placeholder="main" className="text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveGithub} disabled={savingGithub}>
              {savingGithub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleTestGithub} disabled={testingGithub}>
              {testingGithub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vercel Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Vercel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect to Vercel for automatic deployments and preview URLs.
          </p>
          <StatusBadge connected={!!connectedServices.vercel} />
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Vercel Token</Label>
              <Input type="password" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} placeholder="Enter your Vercel token" className="text-sm font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Team ID (optional)</Label>
              <Input value={vercelTeamId} onChange={(e) => setVercelTeamId(e.target.value)} placeholder="team_..." className="text-sm font-mono" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveVercel} disabled={savingVercel}>
              {savingVercel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleTestVercel} disabled={testingVercel}>
              {testingVercel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Netlify Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Netlify
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Alternative deployment provider. Connect for Netlify-based deployments.
          </p>
          <StatusBadge connected={!!connectedServices.netlify} />
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Netlify Personal Access Token</Label>
              <Input type="password" value={netlifyToken} onChange={(e) => setNetlifyToken(e.target.value)} placeholder="Enter your Netlify token" className="text-sm font-mono" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveNetlify} disabled={savingNetlify}>
              {savingNetlify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleTestNetlify} disabled={testingNetlify}>
              {testingNetlify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            API keys for AI content generation and site scraping.
          </p>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Bot className="h-3 w-3" />
                Anthropic API Key
              </Label>
              <Input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." className="text-sm font-mono" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleTestAnthropic} disabled={testingAnthropic} className="h-7 text-xs">
                  {testingAnthropic ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Test
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Flame className="h-3 w-3" />
                Firecrawl API Key
              </Label>
              <Input type="password" value={firecrawlKey} onChange={(e) => setFirecrawlKey(e.target.value)} placeholder="fc-..." className="text-sm font-mono" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleTestFirecrawl} disabled={testingFirecrawl} className="h-7 text-xs">
                  {testingFirecrawl ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Test
                </Button>
              </div>
            </div>
          </div>

          <Button size="sm" onClick={handleSaveApiKeys} disabled={savingApiKeys}>
            {savingApiKeys ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
