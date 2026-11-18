-- Policies: drafts, immutable versions, assignments and exemptions.

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'),
  description text,
  current_version_id uuid,
  -- The single editable draft. Null when there are no unpublished changes.
  draft jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
create index policies_workspace_id_idx on public.policies (workspace_id);

create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  policy_id uuid not null references public.policies (id) on delete cascade,
  semver text not null check (semver ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'),
  content jsonb not null,
  changelog text not null check (char_length(changelog) > 0),
  content_hash text not null,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (policy_id, semver)
);
create index policy_versions_workspace_id_idx on public.policy_versions (workspace_id);

alter table public.policies
  add constraint policies_current_version_id_fkey
  foreign key (current_version_id) references public.policy_versions (id) on delete set null;
alter table public.repo_file_states
  add constraint repo_file_states_applied_version_id_fkey
  foreign key (applied_version_id) references public.policy_versions (id) on delete set null;

-- Published versions never change. Depth > 0 lets FK cascades (deleting a policy
-- or workspace) through while blocking direct UPDATE/DELETE.
create trigger policy_versions_append_only before update or delete on public.policy_versions
  for each row when (pg_trigger_depth() = 0)
  execute function public.prevent_mutation();

create table public.policy_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- One active assignment per repo.
  repository_id uuid not null unique references public.repositories (id) on delete cascade,
  policy_id uuid not null references public.policies (id) on delete cascade,
  pinned_version_id uuid references public.policy_versions (id) on delete restrict,
  track_latest boolean not null default true,
  targets text[] not null default array['agents', 'claude', 'copilot'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (track_latest = (pinned_version_id is null)),
  check (cardinality(targets) > 0)
);
create index policy_assignments_workspace_id_idx on public.policy_assignments (workspace_id);
create index policy_assignments_policy_id_idx on public.policy_assignments (policy_id);

create table public.repo_exemptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  reason text not null check (char_length(reason) > 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index repo_exemptions_workspace_id_idx on public.repo_exemptions (workspace_id);
create index repo_exemptions_repository_id_idx on public.repo_exemptions (repository_id);

create trigger set_updated_at before update on public.policies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.policy_assignments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.repo_exemptions
  for each row execute function public.set_updated_at();

alter table public.policies enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_assignments enable row level security;
alter table public.repo_exemptions enable row level security;

create policy "policies: members read" on public.policies
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "policies: editors insert" on public.policies
  for insert to authenticated with check (public.has_workspace_role(workspace_id, 'editor'));
create policy "policies: editors update" on public.policies
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy "policies: admins delete" on public.policies
  for delete to authenticated using (public.has_workspace_role(workspace_id, 'admin'));

create policy "versions: members read" on public.policy_versions
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "versions: admins publish" on public.policy_versions
  for insert to authenticated with check (public.has_workspace_role(workspace_id, 'admin'));

create policy "assignments: members read" on public.policy_assignments
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "assignments: admins manage" on public.policy_assignments
  for all to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'))
  with check (public.has_workspace_role(workspace_id, 'admin'));

create policy "exemptions: members read" on public.repo_exemptions
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "exemptions: admins insert" on public.repo_exemptions
  for insert to authenticated with check (public.has_workspace_role(workspace_id, 'admin'));
create policy "exemptions: admins update" on public.repo_exemptions
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'))
  with check (public.has_workspace_role(workspace_id, 'admin'));
