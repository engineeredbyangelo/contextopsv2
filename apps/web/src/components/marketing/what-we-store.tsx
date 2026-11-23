import { Check, X } from "lucide-react";
import { H3 } from "./styles";

const COLUMNS = [
  {
    id: "stores",
    title: "What ContextOps stores",
    icon: Check,
    iconClass: "text-success",
    items: [
      "Repository metadata: name, default branch, visibility.",
      "The agent files' managed blocks and their hashes.",
      "Your policy content and every published version.",
      "An audit log of every change, with the actor and the before and after.",
    ],
  },
  {
    id: "never",
    title: "What it never does",
    icon: X,
    iconClass: "text-muted-foreground",
    items: [
      "Store your source code.",
      "Store GitHub tokens.",
      "Push to a default branch or merge a pull request.",
      "Let one workspace see another workspace's rows.",
    ],
  },
] as const;

/** Data minimization, stated plainly (spec: non-negotiable rules). */
export function WhatWeStore() {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
      {COLUMNS.map((col) => (
        <div key={col.id} className="min-w-0 space-y-4">
          <h3 id={`store-${col.id}`} className={H3}>
            {col.title}
          </h3>
          <ul aria-labelledby={`store-${col.id}`} className="divide-y border-y">
            {col.items.map((item) => (
              <li key={item} className="flex gap-3 py-3 text-base leading-relaxed">
                <col.icon
                  aria-hidden
                  strokeWidth={2.4}
                  className={`mt-1.5 size-3.5 shrink-0 ${col.iconClass}`}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
