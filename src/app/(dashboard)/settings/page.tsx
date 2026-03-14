"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { toast } from "@/components/ui/toast";
import { Loader2, Save, Camera, Github, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, profile } = useUser();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [githubOrg, setGithubOrg] = useState("dabhandgroup");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast({ title: "Profile photo updated" });
  }

  const initials = (profile?.full_name || fullName || "DH")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSaveProfile() {
    setSaving(true);
    // Mock: simulate save
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Profile updated" });
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
    // Mock: simulate password change
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Password updated" });
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

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
            Connect your GitHub account to allow automatic repository creation, page deployment, and code management for client projects.
          </p>

          {githubConnected ? (
            <>
              {/* Connected state */}
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Connected to GitHub</p>
                  <p className="text-xs text-muted-foreground">
                    Signed in as <span className="font-medium">@{githubOrg}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => setGithubConnected(false)}
                >
                  Disconnect
                </Button>
              </div>

              {/* Config options */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">GitHub Organisation / Account</Label>
                  <Input
                    value={githubOrg}
                    onChange={(e) => setGithubOrg(e.target.value)}
                    placeholder="e.g. dabhandgroup"
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Repositories will be created under this organisation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Default Branch</Label>
                  <Input
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    placeholder="main"
                    className="text-sm"
                  />
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-medium">Permissions Granted</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      "Create repositories",
                      "Push code",
                      "Manage branches",
                      "Create pull requests",
                      "Manage deployments",
                      "Read organisation",
                    ].map((perm) => (
                      <div key={perm} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                        <span className="text-[11px] text-muted-foreground">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button size="sm" onClick={() => toast({ title: "Settings saved" })}>
                <Save className="h-4 w-4" />
                Save GitHub Settings
              </Button>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Not connected</p>
                  <p className="text-xs text-muted-foreground">
                    Connect GitHub to enable repository creation and page deployment
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-xs font-medium">What you&apos;ll be able to do:</p>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">&#x2022;</span>
                    Automatically create repositories for new client projects
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">&#x2022;</span>
                    Push generated website pages directly to GitHub
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">&#x2022;</span>
                    Deploy sites via Vercel, Netlify, or GitHub Pages integration
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">&#x2022;</span>
                    Manage branches and pull requests from within the builder
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setConnectingGithub(true);
                  setTimeout(() => {
                    setConnectingGithub(false);
                    setGithubConnected(true);
                    toast({ title: "GitHub account connected" });
                  }, 1500);
                }}
                disabled={connectingGithub}
                className="w-full sm:w-auto"
              >
                {connectingGithub ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4" />
                    Connect GitHub Account
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                You&apos;ll be redirected to GitHub to authorise access. We request only the minimum permissions needed.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
