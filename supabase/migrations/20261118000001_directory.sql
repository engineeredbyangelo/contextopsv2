-- Two narrow reads that plain RLS can't express:
--   1. member emails live in auth.users, which `authenticated` can't select;
--   2. an invitee isn't a member yet, so they can't read the invitation row.
-- Both are security definer and return only what the screen needs.

create function public.workspace_member_emails(ws uuid)
returns table (user_id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text
  from public.workspace_members m
  join auth.users u on u.id = m.user_id
  where m.workspace_id = ws and public.is_workspace_member(ws);
$$;

-- Looks an invite up by its raw token (stored only as a sha256 hash). Accepted invites
-- return nothing; expired ones are returned so the page can say so.
create function public.invitation_preview(p_token text)
returns table (
  workspace_name text,
  role public.workspace_role,
  email text,
  expires_at timestamptz,
  invited_by_id uuid,
  invited_by_name text,
  invited_by_login text,
  invited_by_avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.name, i.role, i.email::text, i.expires_at,
         p.user_id, p.name, p.github_login, p.avatar_url
  from public.invitations i
  join public.workspaces w on w.id = i.workspace_id
  left join public.profiles p on p.user_id = i.invited_by
  where i.token_hash = 'sha256:' || encode(extensions.digest(p_token, 'sha256'), 'hex')
    and i.accepted_at is null;
$$;

revoke all on function public.workspace_member_emails(uuid) from public, anon;
revoke all on function public.invitation_preview(text) from public;
grant execute on function public.workspace_member_emails(uuid) to authenticated;
grant execute on function public.invitation_preview(text) to anon, authenticated;
