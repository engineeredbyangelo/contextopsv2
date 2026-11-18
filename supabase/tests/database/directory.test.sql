-- workspace_member_emails and invitation_preview. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-0000000000d1', 'alice@dir-a.test', '{"user_name":"alice","full_name":"Alice"}'),
  ('b0000000-0000-4000-8000-0000000000d1', 'bob@dir-b.test',   '{"user_name":"bob"}');
insert into public.workspaces (id, name, slug) values
  ('a1000000-0000-4000-8000-0000000000d0', 'Dir A', 'dir-a'),
  ('b1000000-0000-4000-8000-0000000000d0', 'Dir B', 'dir-b');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('a1000000-0000-4000-8000-0000000000d0', 'a0000000-0000-4000-8000-0000000000d1', 'owner'),
  ('b1000000-0000-4000-8000-0000000000d0', 'b0000000-0000-4000-8000-0000000000d1', 'owner');
insert into public.invitations (workspace_id, email, role, token_hash, invited_by) values
  ('a1000000-0000-4000-8000-0000000000d0', 'new@dir-a.test', 'viewer',
   'sha256:' || encode(extensions.digest('dir-token-ok', 'sha256'), 'hex'), 'a0000000-0000-4000-8000-0000000000d1');
insert into public.invitations (workspace_id, email, token_hash, accepted_at) values
  ('a1000000-0000-4000-8000-0000000000d0', 'done@dir-a.test',
   'sha256:' || encode(extensions.digest('dir-token-used', 'sha256'), 'hex'), now());

-- ── Member emails ──────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);

select is((select email from public.workspace_member_emails('a1000000-0000-4000-8000-0000000000d0')),
  'alice@dir-a.test', 'member emails: a member sees their workspace');
select is((select count(*) from public.workspace_member_emails('b1000000-0000-4000-8000-0000000000d0')),
  0::bigint, 'member emails: nothing from another workspace');

-- ── Invitation preview (as anon: the invitee isn't signed in yet) ──────────────
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select workspace_name from public.invitation_preview('dir-token-ok')),
  'Dir A', 'invite preview: valid token shows the workspace');
select is((select invited_by_name from public.invitation_preview('dir-token-ok')),
  'Alice', 'invite preview: includes the inviter');
select is((select count(*) from public.invitation_preview('wrong-token')),
  0::bigint, 'invite preview: unknown token returns nothing');
select is((select count(*) from public.invitation_preview('dir-token-used')),
  0::bigint, 'invite preview: accepted invite returns nothing');
select throws_ok($$ select * from public.workspace_member_emails('a1000000-0000-4000-8000-0000000000d0') $$,
  '42501', null, 'member emails: anon cannot call');

select * from finish();
rollback;
