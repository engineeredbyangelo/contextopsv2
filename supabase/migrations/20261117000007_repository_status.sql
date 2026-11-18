-- Compliance status is derived, never stored by hand, so KPIs and lists can't disagree.
-- security_invoker: the caller's RLS applies to every table read here.
--
-- Precedence: disconnected → exempted → unassigned → sync_failed → pending_sync → drifted → compliant.
-- Drift and failures route back through pending_sync once a sync PR is open, so the
-- only way to compliant is a merged PR that makes every target's hash match.

create view public.repository_status
with (security_invoker = true)
as
with latest_item as (
  select distinct on (ri.repository_id)
    ri.repository_id, ri.status, ri.error_code, ri.error_message, ri.created_at
  from public.rollout_items ri
  order by ri.repository_id, ri.created_at desc
),
open_pr as (
  select distinct on (pr.repository_id) pr.repository_id, pr.pr_number, pr.pr_url
  from public.sync_pull_requests pr
  where pr.state = 'open'
  order by pr.repository_id, pr.opened_at desc
),
active_exemption as (
  select distinct on (e.repository_id) e.repository_id, e.id, e.reason, e.expires_at
  from public.repo_exemptions e
  where e.revoked_at is null and (e.expires_at is null or e.expires_at > now())
  order by e.repository_id, e.created_at desc
),
files as (
  select
    a.repository_id,
    count(fs.id) filter (where fs.managed_hash is not null and fs.managed_hash = fs.expected_hash) as matching,
    count(fs.id) filter (where fs.managed_hash is not null and fs.expected_hash is not null and fs.managed_hash <> fs.expected_hash) as drifted,
    max(fs.checked_at) as checked_at,
    (array_agg(fs.applied_version_id order by fs.checked_at desc nulls last)
      filter (where fs.applied_version_id is not null))[1] as applied_version_id
  from public.policy_assignments a
  left join public.repo_file_states fs
    on fs.repository_id = a.repository_id and fs.target = any (a.targets)
  group by a.repository_id
)
select
  r.id as repository_id,
  r.workspace_id,
  case
    when r.disconnected_at is not null or gi.uninstalled_at is not null or gi.suspended_at is not null
      then 'disconnected'
    when ex.id is not null then 'exempted'
    when a.id is null then 'unassigned'
    when li.status = 'failed' then 'sync_failed'
    when op.repository_id is not null or li.status in ('queued', 'running', 'pr_open') then 'pending_sync'
    when coalesce(f.drifted, 0) > 0 then 'drifted'
    when coalesce(f.matching, 0) >= cardinality(a.targets) then 'compliant'
    else 'pending_sync'
  end::public.repository_compliance as status,
  a.policy_id,
  a.targets,
  a.track_latest,
  coalesce(a.pinned_version_id, p.current_version_id) as expected_version_id,
  f.applied_version_id,
  f.checked_at,
  op.pr_number as open_pr_number,
  op.pr_url as open_pr_url,
  case when li.status = 'failed' then li.error_code end as error_code,
  case when li.status = 'failed' then li.error_message end as error_message,
  ex.reason as exemption_reason,
  ex.expires_at as exemption_expires_at
from public.repositories r
join public.github_installations gi on gi.id = r.installation_id
left join public.policy_assignments a on a.repository_id = r.id
left join public.policies p on p.id = a.policy_id
left join files f on f.repository_id = r.id
left join latest_item li on li.repository_id = r.id
left join open_pr op on op.repository_id = r.id
left join active_exemption ex on ex.repository_id = r.id
where not r.archived;
