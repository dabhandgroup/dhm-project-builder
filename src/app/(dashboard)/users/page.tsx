"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { mockProfiles } from "@/lib/mock-data";

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "member">("member");
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleCreate() {
    if (!newEmail.trim() || !newName.trim()) return;
    const tempPassword = generateTempPassword();

    const newProfile = {
      id: `user-${Date.now()}`,
      full_name: newName.trim(),
      email: newEmail.trim(),
      avatar_url: null as null,
      role: newRole,
      created_at: new Date().toISOString(),
      must_change_password: true,
    };

    setProfiles((prev) => [...prev, newProfile]);
    setCreatedUser({ email: newEmail.trim(), password: tempPassword, name: newName.trim() });
    setNewEmail("");
    setNewName("");
    setNewRole("member");
    setShowCreate(false);
  }

  function handleCopyPassword() {
    if (createdUser) {
      navigator.clipboard.writeText(createdUser.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage team members">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {profiles.map((p) => {
          const initials = p.full_name
            ? p.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            : "??";
          return (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.full_name || "Unnamed User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    <p className="text-[10px] text-muted-foreground">Joined {formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={p.role === "admin" ? "default" : "secondary"}>
                      {p.role}
                    </Badge>
                    {p.must_change_password && (
                      <Badge variant="outline" className="text-[10px] text-orange-600 whitespace-nowrap">
                        Pending password
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Add a new team member. They will receive a temporary password and be prompted to change it on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Role</Label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "admin" | "member")}
                options={[
                  { value: "member", label: "Member" },
                  { value: "admin", label: "Admin" },
                ]}
              />
              <p className="text-[10px] text-muted-foreground">
                Admins can create and manage users. Members cannot see the Users page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newEmail.trim() || !newName.trim()}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created User Password Dialog */}
      <Dialog open={!!createdUser} onOpenChange={() => { setCreatedUser(null); setShowPassword(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created</DialogTitle>
            <DialogDescription>
              Share these credentials with {createdUser?.name}. They will be prompted to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{createdUser?.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                  {showPassword ? createdUser?.password : "••••••••••••"}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleCopyPassword}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setCreatedUser(null); setShowPassword(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
