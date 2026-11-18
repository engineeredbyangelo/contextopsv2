import {
  FileCode2,
  FolderGit2,
  LayoutDashboard,
  ScrollText,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { title: string; path: string; icon: LucideIcon; shortcut?: string };

/** Sidebar order from the spec. `path` is relative to /app/[ws]. */
export const NAV: NavItem[] = [
  { title: "Overview", path: "", icon: LayoutDashboard, shortcut: "g o" },
  { title: "Repositories", path: "/repositories", icon: FolderGit2, shortcut: "g r" },
  { title: "Policies", path: "/policies", icon: FileCode2, shortcut: "g p" },
  { title: "Rollouts", path: "/rollouts", icon: Send, shortcut: "g l" },
  { title: "Audit log", path: "/audit-log", icon: ScrollText, shortcut: "g a" },
  { title: "Settings", path: "/settings/general", icon: Settings, shortcut: "g s" },
];

export const wsPath = (slug: string, path = "") => `/app/${slug}${path}`;
