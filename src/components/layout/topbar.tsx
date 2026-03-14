"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Settings, LogOut, User, FolderKanban, X } from "lucide-react";
import { mockProjects, getClientName } from "@/lib/mock-data";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [signOutOpen, setSignOutOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DH";

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setSearchQuery("");
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const filteredProjects = searchQuery.trim()
    ? mockProjects.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.domain_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getClientName(p.client_id)?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Get page title from pathname
  const labelMap: Record<string, string> = {
    projects: "Projects",
    clients: "Clients",
    financials: "Financials",
    content: "Content",
    audit: "Performance Audit",
    "voice-memos": "Voice Memos",
    users: "Users",
    settings: "Settings",
  };
  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = segments.length > 0 ? (labelMap[segments[0]] || segments[0]) : "Dashboard";

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        {/* Mobile: Hamburger */}
        <MobileNav />

        {/* Mobile title */}
        <h1 className="text-sm font-semibold lg:hidden flex-1">{pageTitle}</h1>

        {/* Desktop: Search bar */}
        <div className="hidden lg:flex flex-1">
          <button
            type="button"
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
            className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/60 transition-colors w-full max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search projects...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Mobile: Search icon */}
        <button
          type="button"
          onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
          className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>

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
              onClick={() => setSignOutOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setSearchOpen(false)}>
          <div
            className="mx-auto mt-[15vh] w-full max-w-lg rounded-xl border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, clients, domains..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-auto p-2">
              {searchQuery.trim() === "" ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Start typing to search...
                </p>
              ) : filteredProjects.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No projects found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/projects/${project.id}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-accent transition-colors"
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.domain_name || "No domain"}
                        {getClientName(project.client_id) && ` · ${getClientName(project.client_id)}`}
                      </p>
                    </div>
                    <span className="text-xs text-green-600 font-medium shrink-0">
                      £{project.recurring_revenue}/mo
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign out confirmation dialog */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to sign out of your account?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOutOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSignOutOpen(false);
                window.location.href = "/login";
              }}
            >
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
