"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase recovery links redirect with tokens in the URL hash.
    // The Supabase client auto-detects these and establishes a session.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
        setInitializing(false);
      }
    });

    // Also check if we already have a session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setInitializing(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }

  if (initializing) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-sm font-bold">
            DH
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dab Hand Marketing
          </span>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-sm font-bold">
            DH
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dab Hand Marketing
          </span>
        </div>
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-2xl font-semibold tracking-tight">Password updated</h2>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-sm font-bold">
            DH
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            Dab Hand Marketing
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Invalid or expired link</h2>
          <p className="text-sm text-muted-foreground">
            This password reset link has expired or is invalid.
            Please request a new one from the login page.
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/login")}
          className="w-full h-11 text-sm font-medium"
        >
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white text-sm font-bold">
          DH
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Dab Hand Marketing
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            New Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11 bg-white"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </div>
  );
}
