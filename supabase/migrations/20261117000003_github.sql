-- GitHub: App installations, repositories and per-target file state.

create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  installation_id bigint not null unique,
  account_login text not null,
  account_type public.github_account_type not null,
  repo_selection public.repo_selection not null,
  suspended_at timestamptz,
  uninstalled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index github_installations_workspace_id_idx on public.github_installations (workspace_id);

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  installation_id uuid not null references public.github_installations (id) on delete cascade,
  github_repo_id bigint not null,
  owner_login text not null,
  name text not null,
  full_name text not null,
  default_branch text not null default 'main',
  visibility public.repo_visibility not null,
  archived boolean not null default false,
  primary_language text,
  variables jsonb not null default '{}'::jsonb,
  last_scanned_at timestamptz,
  -- Set when the App loses access (uninstall or repo removed). History is kept.
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, github_repo_id)
);
create index repositories_workspace_id_idx on public.repositories (workspace_id);
create index repositories_installation_id_idx on public.repositories (installation_id);

-- One row per repo × target. Drives compliance status.
create table public.repo_file_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  target text not null,
  path text not null,
  blob_sha text,
  -- Hash of the managed block currently in the file (null: no file or no markers).
  managed_hash text,
  -- Hash the managed block should have for the last version synced to this repo.
  expected_hash text,
  -- Policy version whose render the managed block last matched.
  applied_version_id uuid,
  -- Unified diff of the drifted managed block, for the repository page.
  drift_diff text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repository_id, target)
);
create index repo_file_states_workspace_id_idx on public.repo_file_states (workspace_id);

create trigger set_updated_at before update on public.github_installations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.repositories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.repo_file_states
  for each row execute function public.set_updated_at();

alter table public.github_installations enable row level security;
alter table public.repositories enable row level security;
alter table public.repo_file_states enable row level security;

-- Installations are written by the install callback and webhooks; admins may disconnect.
create policy "installations: members read" on public.github_installations
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "installations: admins insert" on public.github_installations
  for insert to authenticated with check (public.has_workspace_role(workspace_id, 'admin'));
create policy "installations: admins delete" on public.github_installations
  for delete to authenticated using (public.has_workspace_role(workspace_id, 'admin'));

-- Repos are discovered by jobs; admins edit per-repo variables.
create policy "repositories: members read" on public.repositories
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "repositories: admins update" on public.repositories
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'))
  with check (public.has_workspace_role(workspace_id, 'admin'));

create policy "file states: members read" on public.repo_file_states
  for select to authenticated using (public.is_workspace_member(workspace_id));
