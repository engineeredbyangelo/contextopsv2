"use client";

import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      as="h1"
      icon={TriangleAlert}
      title="Something went wrong loading this page"
      description="Try again. If it keeps happening, the error has been logged with its request id."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
