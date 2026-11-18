"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * A real button for an action whose backend isn't built yet. Clicking explains which
 * phase delivers it. Grep for PendingButton to find every action left to wire up.
 */
export function PendingButton({
  phase,
  feature,
  ...props
}: React.ComponentProps<typeof Button> & { phase: 2 | 3 | 4; feature: string }) {
  return (
    <Button
      {...props}
      onClick={() =>
        toast.info(`${feature} arrives in phase ${phase}`, {
          description: "This screen uses demo data for now.",
        })
      }
    />
  );
}
