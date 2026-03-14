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
import { Loader2, Save, Camera } from "lucide-react";

export default function SettingsPage() {
  const { user, profile } = useUser();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
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
    </div>
  );
}
