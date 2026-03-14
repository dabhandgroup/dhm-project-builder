"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, DollarSign, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileFooter() {
  const pathname = usePathname();

  const items = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Financials", href: "/financials", icon: DollarSign },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
      <nav className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
