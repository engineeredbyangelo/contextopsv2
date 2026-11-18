-- Tenant isolation and role checks. Run with `pnpm db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

-- ── Fixtures: two workspaces, one member each, plus a viewer in A ──────────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-000000000001', 'alice@a.test', '{"user_name":"alice"}'),
  ('b0000000-0000-4000-8000-000000000001', 'bob@b.test',   '{"user_name":"bob"}'),
  ('a0000000-0000-4000-8000-000000000002', 'vic@a.test',   '{"user_name":"vic"}');

insert into public.workspaces (id, name, slug) values
  ('a1000000-0000-4000-8000-000000000000', 'A', 'ws-a'),
  ('b1000000-0000-4000-8000-000000000000', 'B', 'ws-b');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('a1000000-0000-4000-8000-000000000000', 'a0000000-0000-4000-8000-000000000001', 'owner'),
  ('a1000000-0000-4000-8000-000000000000', 'a0000000-0000-4000-8000-000000000002', 'viewer'),
  ('b1000000-0000-4000-8000-000000000000', 'b0000000-0000-4000-8000-000000000001', 'owner');

-- One row in every tenant table for each workspace.
do $$
declare
  ws uuid;
  inst uuid; repo uuid; pol uuid; ver uuid; rol uuid; item uuid;
begin
  foreach ws in array array['a1000000-0000-4000-8000-000000000000', 'b1000000-0000-4000-8000-000000000000']::uuid[] loop
    insert into public.invitations (workspace_id, email, token_hash) values (ws, ws || '@x.test', md5(ws::text));
    insert into public.github_installations (workspace_id, installation_id, account_login, account_type, repo_selection)
      values (ws, abs(hashtext(ws::text)), 'org-' || ws, 'organization', 'all') returning id into inst;
    insert into public.repositories (workspace_id, installation_id, github_repo_id, owner_login, name, full_name, visibility)
      values (ws, inst, abs(hashtext(ws::text)), 'org', 'repo', 'org/repo', 'private') returning id into repo;
    insert into public.policies (workspace_id, name, slug) values (ws, 'P', 'p') returning id into pol;
    insert into public.policy_versions (workspace_id, policy_id, semver, content, changelog, content_hash)
      values (ws, pol, '1.0.0', '{}', 'init', 'h') returning id into ver;
    insert into public.policy_assignments (workspace_id, repository_id, policy_id) values (ws, repo, pol);
    insert into public.repo_exemptions (workspace_id, repository_id, reason) values (ws, repo, 'why');
    insert into public.repo_file_states (workspace_id, repository_id, target, path) values (ws, repo, 'agents', 'AGENTS.md');
    insert into public.rollouts (workspace_id, policy_version_id, targets) values (ws, ver, array['agents']) returning id into rol;
    insert into public.rollout_items (workspace_id, rollout_id, repository_id) values (ws, rol, repo) returning id into item;
    insert into public.sync_pull_requests (workspace_id, repository_id, rollout_item_id, pr_number, pr_url, title)
      values (ws, repo, item, 1, 'https://github.com/org/repo/pull/1', 't');
    insert into public.audit_events (workspace_id, actor_type, action, subject_type) values (ws, 'system', 'policy.published', 'policy');
  end loop;
end $$;

-- ── Act as Alice (owner of A) ──────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}';

-- Every tenant table: Alice sees her row in A and zero rows from B.
select is((select count(*) from public.workspaces where id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'workspaces: no rows from B');
select is((select count(*) from public.workspace_members where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'workspace_members: no rows from B');
select is((select count(*) from public.invitations where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'invitations: no rows from B');
select is((select count(*) from public.github_installations where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'github_installations: no rows from B');
select is((select count(*) from public.repositories where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'repositories: no rows from B');
select is((select count(*) from public.policies where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'policies: no rows from B');
select is((select count(*) from public.policy_versions where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'policy_versions: no rows from B');
select is((select count(*) from public.policy_assignments where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'policy_assignments: no rows from B');
select is((select count(*) from public.repo_exemptions where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'repo_exemptions: no rows from B');
select is((select count(*) from public.repo_file_states where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'repo_file_states: no rows from B');
select is((select count(*) from public.rollouts where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'rollouts: no rows from B');
select is((select count(*) from public.rollout_items where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'rollout_items: no rows from B');
select is((select count(*) from public.sync_pull_requests where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'sync_pull_requests: no rows from B');
select is((select count(*) from public.audit_events where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'audit_events: no rows from B');
select is((select count(*) from public.repository_status where workspace_id = 'b1000000-0000-4000-8000-000000000000'), 0::bigint, 'repository_status view: no rows from B');
select is((select count(*) from public.profiles where user_id = 'b0000000-0000-4000-8000-000000000001'), 0::bigint, 'profiles: cannot see users outside shared workspaces');

select is((select count(*) from public.repositories), 1::bigint, 'repositories: sees own workspace row');
select is((select count(*) from public.profiles), 2::bigint, 'profiles: sees self and teammate');

-- Writes into B are rejected.
select throws_ok(
  $$insert into public.policies (workspace_id, name, slug) values ('b1000000-0000-4000-8000-000000000000', 'X', 'x')$$,
  '42501', null, 'cannot insert a policy into B');
select is_empty(
  $$update public.workspaces set name = 'pwned' where id = 'b1000000-0000-4000-8000-000000000000' returning id$$,
  'cannot update workspace B');
select throws_ok(
  $$select public.log_audit_event('b1000000-0000-4000-8000-000000000000', 'policy.published', 'policy')$$,
  '42501', null, 'cannot write audit events into B');

-- Append-only rules hold even for an owner.
select throws_ok(
  $$update public.audit_events set action = 'x.y' where workspace_id = 'a1000000-0000-4000-8000-000000000000'$$,
  '42501', null, 'audit events: no direct UPDATE by users');
select lives_ok(
  $$select public.log_audit_event('a1000000-0000-4000-8000-000000000000', 'policy.published', 'policy')$$,
  'owner can log an audit event in own workspace');

reset role;
select throws_ok(
  $$update public.policy_versions set changelog = 'edited'$$,
  '23001', null, 'policy_versions: published versions are immutable');
select throws_ok(
  $$delete from public.audit_events$$,
  '23001', null, 'audit_events: append-only even for the service role');
select lives_ok(
  $$delete from public.workspaces where id = 'b1000000-0000-4000-8000-000000000000'$$,
  'deleting a workspace cascades through append-only tables');

-- ── Act as Vic (viewer in A) ───────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}';

select throws_ok(
  $$insert into public.policies (workspace_id, name, slug) values ('a1000000-0000-4000-8000-000000000000', 'X', 'x')$$,
  '42501', null, 'viewer cannot create policies');
select is_empty(
  $$update public.workspace_members set role = 'owner' where user_id = 'a0000000-0000-4000-8000-000000000002' returning id$$,
  'viewer cannot promote themselves');

-- ── Anonymous ──────────────────────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok($$select count(*) from public.repositories$$, '42501', null, 'anon has no table access');

select * from finish();
rollback;
