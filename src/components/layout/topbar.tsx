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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
        inputRef.current?.focus();
        setSearchQuery("");
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setSearchFocused(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredProjects = searchQuery.trim()
    ? mockProjects.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.domain_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getClientName(p.client_id)?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const showDropdown = searchFocused && searchQuery.trim().length > 0;

  // Get page title from pathname
  const labelMap: Record<string, string> = {
    projects: "Projects",
    clients: "Clients",
    financials: "Financials",
    content: "Content",
    audit: "Performance Audit",
    notes: "Notes",
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

        {/* Desktop: Inline search bar */}
        <div className="hidden lg:flex flex-1" ref={searchContainerRef}>
          <div className="relative w-full">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 transition-colors focus-within:bg-background focus-within:ring-1 focus-within:ring-ring w-full">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search projects, clients, domains..."
                className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {!searchQuery && (
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-background shadow-lg max-h-[400px] overflow-auto">
                {filteredProjects.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No projects found for &ldquo;{searchQuery}&rdquo;
                  </p>
                ) : (
                  <div className="p-1">
                    {filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery("");
                          router.push(`/projects/${project.id}`);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors"
                      >
                        <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{project.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.domain_name || "No domain"}
                            {getClientName(project.client_id) && ` · ${getClientName(project.client_id)}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Search icon */}
        <button
          type="button"
          onClick={() => {
            setMobileSearchOpen(true);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
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

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex items-center gap-2 border-b px-4 h-14">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, clients, domains..."
              className="flex-1 bg-transparent py-2 text-base sm:text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-3.5rem)]">
            {searchQuery.trim() && filteredProjects.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No projects found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : searchQuery.trim() ? (
              <div className="p-2">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setMobileSearchOpen(false);
                      setSearchQuery("");
                      router.push(`/projects/${project.id}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-accent transition-colors"
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.domain_name || "No domain"}
                        {getClientName(project.client_id) && ` · ${getClientName(project.client_id)}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Start typing to search...
              </p>
            )}
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
