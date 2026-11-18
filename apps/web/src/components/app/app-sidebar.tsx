"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Plus, Search } from "lucide-react";
import { LogoMark } from "@/components/app/logo";
import { PersonAvatar } from "@/components/app/person-avatar";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { signOut } from "@/server/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV, wsPath } from "@/lib/nav";
import { PLANS } from "@/lib/plans";
import { openCommandPalette } from "@/components/app/command-palette";
import type { CurrentUser, WorkspaceSummary } from "@/server/data/types";

export function AppSidebar({
  workspace,
  workspaces,
  user,
}: {
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  user: CurrentUser;
}) {
  const pathname = usePathname();
  const base = wsPath(workspace.slug);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" aria-label="Switch workspace">
                  <span className="bg-sidebar-accent flex size-8 shrink-0 items-center justify-center rounded-md">
                    <LogoMark className="size-4" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{workspace.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {PLANS[workspace.plan].name} plan
                    </span>
                  </span>
                  <ChevronsUpDown className="text-muted-foreground ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((w) => (
                  <DropdownMenuItem key={w.id} asChild>
                    <Link href={wsPath(w.slug)}>
                      <span className="flex-1 truncate">{w.name}</span>
                      {w.id === workspace.id ? <Check className="size-4" /> : null}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/onboarding">
                    <Plus className="size-4" /> Create workspace
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={openCommandPalette}
              tooltip="Search (⌘K)"
              className="text-muted-foreground"
            >
              <Search />
              <span>Search…</span>
              <Kbd className="ml-auto">⌘K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const href = base + item.path;
                const section =
                  base + (item.path.startsWith("/settings") ? "/settings" : item.path);
                const active = item.path === "" ? pathname === base : pathname.startsWith(section);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={href} aria-current={active ? "page" : undefined}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" aria-label="Account menu">
                  <PersonAvatar person={user} className="size-7" />
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">@{user.login}</span>
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="group-data-[collapsible=icon]:hidden">
              <ThemeToggle />
            </span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
