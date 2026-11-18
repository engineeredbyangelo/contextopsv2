"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { openCommandPalette } from "@/components/app/command-palette";

export function SearchButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openCommandPalette}
      className="text-muted-foreground"
    >
      {children}
      <Kbd className="ml-2 hidden sm:inline-flex">⌘K</Kbd>
    </Button>
  );
}
