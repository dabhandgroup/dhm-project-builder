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
        <Link href="/" className="flex items-center font-bold">
          <svg
            viewBox="0 0 288.1 450.3"
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 shrink-0"
            aria-label="DHM"
          >
            <path
              fill="currentColor"
              d="M282.6,138.1l-4.1-47.9c0,0-11.1-0.8-18.3,6.3c-7.5,7.5-3.1,38.7-3.1,38.7l-7.2,34l-3.6,4.4l3-18.7l5.3-62.6l-3.5-63.5c0,0-17.6,0.1-26.7,14c-8.6,13.1-1.2,51.1-1.2,51.1l-5.8,25.5l-12.8-51.7L181.8,6.1c0,0-17.2,7.2-24.3,19.1c-7.1,11.8,10.9,52.9,10.9,52.9l7.3,60.1l-1.1,9.2l-17.3-13.7l-58.1-12.3l-59,20.5c0,0,9.2,16.1,20,24.7c10.8,8.6,45.8-1.8,45.8-1.8l32.6,17.4l15.7,52l-32.2,25.4l-48.6-11.2L55,219.8c0,0,1-33.8-4.3-45.9c-5.3-12-32.1-16.9-32.1-16.9L6.3,257.4l71.9,122.5l0.6,28.4L207,443.9l-3-60.1c0,0,40.6-119.9,40.8-132.3c0-1.5-0.1-3.4-0.2-5.6l34.4-65.1L282.6,138.1z"
            />
          </svg>
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
