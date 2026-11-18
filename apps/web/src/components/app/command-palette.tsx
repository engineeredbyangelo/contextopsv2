"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Building2, FileCode2, FolderGit2, Moon, Send, Sun } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { REPO_STATUS } from "@/lib/status";
import { NAV, wsPath } from "@/lib/nav";
import type { SearchIndex, WorkspaceSummary } from "@/server/data/types";

const OPEN_EVENT = "contextops:command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** ⌘K palette plus the global `g <key>` navigation shortcuts. */
export function CommandPalette({
  workspace,
  workspaces,
  index,
}: {
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  index: SearchIndex;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const pendingG = useRef<number | null>(null);
  const base = wsPath(workspace.slug);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        isTyping(e.target) ||
        document.querySelector("[role=dialog][data-state=open]")
      )
        return;
      if (pendingG.current !== null) {
        const item = NAV.find((n) => n.shortcut === `g ${e.key}`);
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        if (item) {
          e.preventDefault();
          router.push(base + item.path);
        }
      } else if (e.key === "g") {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 1000);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [base, router]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Jump to a page, repository or policy"
    >
      <Command>
        <CommandInput placeholder="Search repositories, policies, actions…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go(`${base}/rollouts/new`)}>
              <Send /> Start a rollout
            </CommandItem>
            <CommandItem onSelect={() => go(`${base}/policies/new`)}>
              <FileCode2 /> New policy
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />} Toggle theme
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Go to">
            {NAV.map((n) => (
              <CommandItem key={n.title} onSelect={() => go(base + n.path)}>
                <n.icon /> {n.title}
                {n.shortcut ? <CommandShortcut>{n.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Repositories">
            {index.repos.map((r) => (
              <CommandItem
                key={r.id}
                value={`repo ${r.fullName}`}
                onSelect={() => go(`${base}/repositories/${r.id}`)}
              >
                <FolderGit2 /> {r.fullName}
                <CommandShortcut>{REPO_STATUS[r.status].label}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Policies">
            {index.policies.map((p) => (
              <CommandItem
                key={p.id}
                value={`policy ${p.name}`}
                onSelect={() => go(`${base}/policies/${p.id}`)}
              >
                <FileCode2 /> {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
          {workspaces.length > 1 ? (
            <CommandGroup heading="Switch workspace">
              {workspaces.map((w) => (
                <CommandItem
                  key={w.id}
                  value={`workspace ${w.name}`}
                  onSelect={() => go(wsPath(w.slug))}
                >
                  <Building2 /> {w.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
