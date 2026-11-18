-- Audit log: insert-only. Users write through log_audit_event(); jobs use the service role.

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_type public.actor_type not null,
  action text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  subject_type text not null,
  subject_id text,
  -- before/after and any context needed to read the event later.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audit_events_workspace_id_idx on public.audit_events (workspace_id, created_at desc);

create trigger audit_events_append_only before update or delete on public.audit_events
  for each row when (pg_trigger_depth() = 0)
  execute function public.prevent_mutation();

alter table public.audit_events enable row level security;

create policy "audit: members read" on public.audit_events
  for select to authenticated using (public.is_workspace_member(workspace_id));

create function public.log_audit_event(
  p_workspace_id uuid,
  p_action text,
  p_subject_type text,
  p_subject_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'not a member of this workspace' using errcode = 'insufficient_privilege';
  end if;
  insert into public.audit_events (workspace_id, actor_id, actor_type, action, subject_type, subject_id, metadata)
  values (p_workspace_id, (select auth.uid()), 'user', p_action, p_subject_type, p_subject_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into event_id;
  return event_id;
end;
$$;
