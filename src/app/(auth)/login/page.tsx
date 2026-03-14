"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    window.location.href = "/";
  }

  return (
    <div className="space-y-8">
      {/* Mobile logo — hidden on desktop where left panel shows */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-sm font-bold">
          DH
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Dab Hand Marketing
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@dabhandmarketing.com"
            defaultValue="danny@dabhandmarketing.com"
            required
            autoComplete="email"
            className="h-11 bg-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            defaultValue="password123"
            required
            autoComplete="current-password"
            className="h-11 bg-white"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="text-foreground font-medium hover:underline"
        >
          Contact your admin
        </button>
      </p>
    </div>
  );
}
