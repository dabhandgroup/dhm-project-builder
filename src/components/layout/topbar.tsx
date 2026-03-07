"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/actions/auth";
import Link from "next/link";
import { Settings, LogOut, User } from "lucide-react";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  const labelMap: Record<string, string> = {
    projects: "Projects",
    new: "New Project",
    clients: "Clients",
    financials: "Financials",
    content: "Content",
    audit: "Performance Audit",
    "voice-memos": "Voice Memos",
    users: "Users",
    settings: "Settings",
    edit: "Edit",
  };

  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const label =
      labelMap[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ label, href });
  }

  return breadcrumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const { profile } = useUser();
  const breadcrumbs = getBreadcrumbs(pathname);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DH";

  const pageTitle =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].label
      : "Dashboard";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile: Hamburger */}
      <MobileNav />

      {/* Breadcrumbs (desktop) / Title (mobile) */}
      <div className="flex-1">
        {/* Mobile title */}
        <h1 className="text-sm font-semibold lg:hidden">{pageTitle}</h1>

        {/* Desktop breadcrumbs */}
        <nav className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              <span className="text-muted-foreground/50">/</span>
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded-full">
            <Avatar className="h-8 w-8">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} />
              )}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            {profile?.full_name || "User"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            onClick={() => {
              const form = document.createElement("form");
              form.action = "/";
              form.method = "POST";
              document.body.appendChild(form);
              signOut();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
