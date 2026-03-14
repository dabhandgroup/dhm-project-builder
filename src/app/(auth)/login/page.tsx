import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
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

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@dabhandmarketing.com"
            defaultValue="danny@dabhandmarketing.com"
            className="h-11 bg-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Forgot password?
            </span>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            defaultValue="password123"
            className="h-11 bg-white"
          />
        </div>

        <Link
          href="/"
          className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <span className="text-foreground font-medium cursor-pointer hover:underline">
          Contact your admin
        </span>
      </p>
    </div>
  );
}
