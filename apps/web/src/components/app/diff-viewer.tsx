"use client";

import { useMemo } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";

/** Unified diff of a file, e.g. a drifted managed block. */
export function DiffViewer({ diff }: { diff: string }) {
  const files = useMemo(() => parseDiff(diff), [diff]);
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div key={`${file.oldPath}-${file.newPath}`} className="overflow-x-auto rounded-md border">
          <div className="bg-muted/50 border-b px-3 py-1.5 font-mono text-xs">{file.newPath}</div>
          <Diff viewType="unified" diffType={file.type} hunks={file.hunks} className="diff-themed">
            {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
          </Diff>
        </div>
      ))}
    </div>
  );
}
