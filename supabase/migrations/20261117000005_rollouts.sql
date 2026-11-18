-- Rollouts: multi-repo syncs, their per-repo items and the PRs they open.

create table public.rollouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  policy_version_id uuid not null references public.policy_versions (id) on delete restrict,
  targets text[] not null check (cardinality(targets) > 0),
  status public.rollout_status not null default 'queued',
  created_by uuid references auth.users (id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rollouts_workspace_id_idx on public.rollouts (workspace_id, created_at desc);

create table public.rollout_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  rollout_id uuid not null references public.rollouts (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  status public.rollout_item_status not null default 'queued',
  branch text,
  pr_number integer,
  pr_url text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rollout_id, repository_id)
);
create index rollout_items_workspace_id_idx on public.rollout_items (workspace_id);
create index rollout_items_repository_id_idx on public.rollout_items (repository_id, created_at desc);

create table public.sync_pull_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  rollout_item_id uuid references public.rollout_items (id) on delete set null,
  pr_number integer not null,
  pr_url text not null,
  title text not null,
  state public.pull_request_state not null default 'open',
  head_sha text,
  opened_at timestamptz not null default now(),
  merged_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repository_id, pr_number)
);
create index sync_pull_requests_workspace_id_idx on public.sync_pull_requests (workspace_id);
create index sync_pull_requests_open_idx on public.sync_pull_requests (repository_id) where state = 'open';

create trigger set_updated_at before update on public.rollouts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.rollout_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.sync_pull_requests
  for each row execute function public.set_updated_at();

alter table public.rollouts enable row level security;
alter table public.rollout_items enable row level security;
alter table public.sync_pull_requests enable row level security;

-- Editors may start rollouts at the data layer; whether the workspace requires admin
-- approval is enforced by requireRole() in the server action. Jobs write progress.
create policy "rollouts: members read" on public.rollouts
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "rollouts: editors create" on public.rollouts
  for insert to authenticated with check (public.has_workspace_role(workspace_id, 'editor'));

create policy "rollout items: members read" on public.rollout_items
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy "sync PRs: members read" on public.sync_pull_requests
  for select to authenticated using (public.is_workspace_member(workspace_id));
