import {
  Plus,
  FolderKanban,
  Users,
  DollarSign,
  PenTool,
  Gauge,
  StickyNote,
  Mic,
  UserCog,
  Settings,
  LayoutDashboard,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  accent?: boolean;
  separatorBefore?: boolean;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "New Project",
    href: "/projects/new",
    icon: Plus,
    accent: true,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Financials",
    href: "/financials",
    icon: DollarSign,
  },
  {
    label: "Content",
    href: "/content",
    icon: PenTool,
  },
  {
    label: "Templates",
    href: "/templates",
    icon: LayoutTemplate,
  },
  {
    label: "Performance Audit",
    href: "/audit",
    icon: Gauge,
  },
  {
    label: "Notes",
    href: "/notes",
    icon: StickyNote,
    separatorBefore: true,
  },
  {
    label: "Voice Memos",
    href: "/voice-memos",
    icon: Mic,
  },
  {
    label: "Users",
    href: "/users",
    icon: UserCog,
    adminOnly: true,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
