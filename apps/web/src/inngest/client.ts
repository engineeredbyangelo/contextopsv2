import { Inngest } from "inngest";

/** Background jobs: discover, rollout, sync-repo, drift-scan (phases 2–3). */
export const inngest = new Inngest({ id: "contextops" });
