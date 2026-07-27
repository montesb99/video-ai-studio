-- 013 — Funciones y triggers · docs/02-DATA-MODEL.md §12 (helper), §13, §600 (ledger)

-- Patrón hold → commit | refund. Nunca un UPDATE directo sobre un saldo:
-- el saldo es derivable y auditable desde credit_ledger.
create or replace function credits_move(
  p_workspace uuid, p_delta integer, p_reason credit_reason, p_project uuid
) returns integer language plpgsql security definer as $$
declare v_balance integer;
begin
  select credits_balance into v_balance
    from workspaces where id = p_workspace for update;

  if p_reason = 'hold' and v_balance + p_delta < 0 then
    raise exception 'insufficient_credits';
  end if;

  v_balance := v_balance + p_delta;
  update workspaces set credits_balance = v_balance where id = p_workspace;

  insert into credit_ledger (workspace_id, delta, reason, project_id, balance_after)
  values (p_workspace, p_delta, p_reason, p_project, v_balance);

  return v_balance;
end $$;

-- Helper de RLS: workspaces a los que pertenece el usuario actual.
create or replace function current_workspaces() returns setof uuid
language sql stable security definer as $$
  select workspace_id from workspace_members where user_id = auth.uid();
$$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger projects_touch before update on projects
  for each row execute function touch_updated_at();
