import "server-only";
import { loadDataset } from "./supabase";
import { createDataLayer } from "./views";

/**
 * Data layer. Every page reads through these functions. Rows come from Supabase with the
 * signed-in user's session (RLS-scoped); ./views turns them into view models.
 */
export const {
  getCurrentUser,
  listMyWorkspaces,
  getWorkspace,
  listRepositories,
  getRepository,
  listPolicies,
  getPolicy,
  listRollouts,
  getRollout,
  listAuditEvents,
  listMembers,
  listInvitations,
  listInstallations,
  getBilling,
  getOverview,
  getSearchIndex,
  listImportCandidates,
  listPolicyVersionOptions,
} = createDataLayer(loadDataset);
export { getInvite } from "./supabase";
export type * from "./types";
