-- Foundation: extensions, enums and generic trigger helpers.

create extension if not exists citext with schema extensions;

-- Ordered lowest → highest so `role >= 'admin'` means "admin or owner".
create type public.workspace_role as enum ('viewer', 'editor', 'admin', 'owner');
create type public.workspace_plan as enum ('free', 'team', 'agency', 'enterprise');
create type public.github_account_type as enum ('organization', 'user');
create type public.repo_selection as enum ('all', 'selected');
create type public.repo_visibility as enum ('public', 'private', 'internal');
create type public.rollout_status as enum ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled');
create type public.rollout_item_status as enum ('queued', 'running', 'pr_open', 'up_to_date', 'merged', 'closed', 'failed', 'skipped');
create type public.pull_request_state as enum ('open', 'merged', 'closed');
create type public.actor_type as enum ('user', 'system', 'github');
create type public.repository_compliance as enum (
  'compliant', 'drifted', 'pending_sync', 'sync_failed', 'exempted', 'disconnected', 'unassigned'
);

-- Keeps updated_at current on every tenant table.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Blocks UPDATE/DELETE on append-only tables (published policy versions, audit events).
create function public.prevent_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = 'restrict_violation';
end;
$$;
