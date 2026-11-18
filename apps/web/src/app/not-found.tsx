import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md items-center px-4">
      <EmptyState
        as="h1"
        icon={SearchX}
        title="Nothing here"
        description="This page doesn't exist, or you don't have access to it."
        action={
          <Button asChild>
            <Link href="/app">Go to your workspace</Link>
          </Button>
        }
      />
    </main>
  );
}
