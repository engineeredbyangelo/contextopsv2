-- Tenancy: profiles, workspaces, membership, invitations and the RLS helpers.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  github_login text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$'),
  plan public.workspace_plan not null default 'free',
  stripe_customer_id text unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email extensions.citext not null,
  role public.workspace_role not null default 'viewer' check (role <> 'owner'),
  token_hash text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invitations_workspace_id_idx on public.invitations (workspace_id);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workspace_members
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.invitations
  for each row execute function public.set_updated_at();

-- RLS helpers. SECURITY DEFINER so policies on workspace_members don't recurse.
create function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create function public.has_workspace_role(ws uuid, min_role public.workspace_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role >= min_role
  );
$$;

-- Creates a workspace and makes the caller its owner in one step.
create function public.create_workspace(p_name text, p_slug text, p_settings jsonb default '{}'::jsonb)
returns public.workspaces
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws public.workspaces;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  insert into public.workspaces (name, slug, settings)
  values (p_name, p_slug, coalesce(p_settings, '{}'::jsonb))
  returning * into ws;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws.id, (select auth.uid()), 'owner');
  return ws;
end;
$$;

-- First sign-in: copy GitHub identity from auth metadata into profiles.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, github_login, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'preferred_username'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;

create policy "profiles: read self and teammates" on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members theirs
      where theirs.user_id = profiles.user_id
        and public.is_workspace_member(theirs.workspace_id)
    )
  );
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "workspaces: members read" on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));
create policy "workspaces: admins update" on public.workspaces
  for update to authenticated
  using (public.has_workspace_role(id, 'admin'))
  with check (public.has_workspace_role(id, 'admin'));
create policy "workspaces: owners delete" on public.workspaces
  for delete to authenticated using (public.has_workspace_role(id, 'owner'));

create policy "members: members read" on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));
-- Admins manage non-owner memberships; only owners touch owner rows.
create policy "members: admins insert" on public.workspace_members
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'admin')
    and (role <> 'owner' or public.has_workspace_role(workspace_id, 'owner'))
  );
create policy "members: admins update" on public.workspace_members
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, 'admin')
    and (role <> 'owner' or public.has_workspace_role(workspace_id, 'owner'))
  )
  with check (
    public.has_workspace_role(workspace_id, 'admin')
    and (role <> 'owner' or public.has_workspace_role(workspace_id, 'owner'))
  );
create policy "members: admins delete, anyone leaves" on public.workspace_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.has_workspace_role(workspace_id, 'admin')
      and (role <> 'owner' or public.has_workspace_role(workspace_id, 'owner'))
    )
  );

create policy "invitations: admins manage" on public.invitations
  for all to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'))
  with check (public.has_workspace_role(workspace_id, 'admin'));
