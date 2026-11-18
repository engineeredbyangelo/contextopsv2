-- API exposure: nothing for anon; authenticated goes through RLS; service_role is for jobs.

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, public;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function public.has_workspace_role(uuid, public.workspace_role) to authenticated, service_role;
grant execute on function public.create_workspace(text, text, jsonb) to authenticated;
grant execute on function public.log_audit_event(uuid, text, text, text, jsonb) to authenticated;

-- Append-only tables: refuse outright rather than silently matching zero rows.
revoke update, delete on public.audit_events, public.policy_versions from authenticated;
-- Users write audit events only through log_audit_event().
revoke insert on public.audit_events from authenticated;
