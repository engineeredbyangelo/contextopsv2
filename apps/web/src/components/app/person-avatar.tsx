import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Person } from "@/server/data/types";

export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  return (
    <Avatar className={cn("size-6", className)}>
      {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt="" /> : null}
      <AvatarFallback className="text-[10px]">{initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

export function PersonLabel({ person }: { person: Person | null }) {
  if (!person) return <span className="text-muted-foreground">ContextOps</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <PersonAvatar person={person} className="size-5" />
      <span className="truncate">{person.name}</span>
    </span>
  );
}
