"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants/nav-items";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/actions/auth";
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
        "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[4.5rem]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" className="flex items-center gap-2 font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.dabhandmarketing.com/assets/images/61a448de805ef0ab7c7c6309_5fd49badb4d94e90bf469db6_dhm-logo-4.svg"
            alt="DHM"
            className="h-12 w-12 shrink-0 rounded-lg object-contain"
          />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
              dab hand marketing
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4">
        <ul className={cn("space-y-1", collapsed ? "px-0 flex flex-col items-center" : "px-2")}>
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const linkEl = (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    item.accent &&
                      !isActive &&
                      "text-primary hover:text-primary",
                    collapsed
                      ? "justify-center h-10 w-10"
                      : "gap-3 px-3 py-2"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-foreground" : ""
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              </li>
            );

            if (item.separatorBefore) {
              return (
                <div key={item.href} className={collapsed ? "w-10" : "w-full"}>
                  <Separator className="my-2" />
                  {linkEl}
                </div>
              );
            }

            return linkEl;
          })}
        </ul>
      </nav>

      <Separator />

      {/* Collapse toggle + Sign out */}
      <div className={cn("p-2 space-y-1", collapsed && "flex flex-col items-center")}>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex items-center rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
            collapsed
              ? "justify-center h-10 w-10"
              : "gap-3 px-3 py-2 w-full"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5 shrink-0" />
          ) : (
            <PanelLeftClose className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && (
            <span className="whitespace-nowrap">Collapse</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className={cn(
            "flex items-center rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-destructive transition-colors",
            collapsed
              ? "justify-center h-10 w-10"
              : "gap-3 px-3 py-2 w-full"
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <span className="whitespace-nowrap">Sign out</span>
          )}
        </button>
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
