"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants/nav-items";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/actions/auth";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[4.5rem]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            DH
          </div>
          <span
            className={cn(
              "text-sm font-semibold tracking-tight whitespace-nowrap transition-opacity duration-200",
              collapsed ? "opacity-0 w-0" : "opacity-100"
            )}
          >
            DHM Builder
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const link = (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    item.accent &&
                      !isActive &&
                      "text-primary hover:text-primary",
                    collapsed && "justify-center px-0 w-10 mx-auto"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-foreground" : ""
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-opacity duration-200",
                      collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} content={item.label} side="right">
                  {link}
                </Tooltip>
              );
            }

            return link;
          })}
        </ul>
      </nav>

      <Separator />

      {/* Collapse toggle + Sign out */}
      <div className="p-2 space-y-1">
        {(() => {
          const collapseBtn = (
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 w-full text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
                collapsed && "justify-center px-0 w-10 mx-auto"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeft className="h-5 w-5 shrink-0" />
              ) : (
                <PanelLeftClose className="h-5 w-5 shrink-0" />
              )}
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                Collapse
              </span>
            </button>
          );
          return collapsed ? (
            <Tooltip content="Expand sidebar" side="right">{collapseBtn}</Tooltip>
          ) : collapseBtn;
        })()}

        {(() => {
          const signOutBtn = (
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 w-full text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-destructive transition-colors",
                collapsed && "justify-center px-0 w-10 mx-auto"
              )}
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                Sign out
              </span>
            </button>
          );
          return collapsed ? (
            <Tooltip content="Sign out" side="right">{signOutBtn}</Tooltip>
          ) : signOutBtn;
        })()}
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogout(false)}>
              Cancel
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="destructive">
                Sign out
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
