-- =============================================================================
-- RLS: audit_log (append-only / hash chain)
-- dev-security-w0-skeleton.md §5 / DEC-019-033 §⑤ L4
--   - INSERT: SECURITY DEFINER fn のみ (生 INSERT は revoke)
--   - SELECT: owner + operator (read for dashboard)
--   - UPDATE / DELETE: 完全禁止 (append-only)
-- =============================================================================

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

drop policy if exists audit_log_tenant_isolation on public.audit_log;
create policy audit_log_tenant_isolation
  on public.audit_log
  as restrictive
  for all
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));

drop policy if exists audit_log_select_observers on public.audit_log;
create policy audit_log_select_observers
  on public.audit_log
  for select
  using (coalesce(auth.jwt() ->> 'role', '') in ('owner','operator'));

revoke insert, update, delete on public.audit_log from anon, authenticated;

-- 唯一の正規 INSERT 経路 (SECURITY DEFINER, 内部呼び出し限定)
--
-- P0-1 (review-scaffold-code-review-v1.md §3.1) 対応:
--   並行 INSERT 時に同じ prev_hash を読んで一方が audit_no_branch (unique prev_hash)
--   制約違反で失敗し chain が虫食いになる問題を回避するため、
--   tenant_id 単位で pg_advisory_xact_lock を取得し完全直列化する。
--   さらに unique 違反 (23505) のみ最大 3 回までトランザクション内で再試行する。
--
-- P0-2 (review-scaffold-code-review-v1.md §3.1) 対応:
--   Node 側 canonicalize() と DB 側 jsonb::text の不一致による hash mismatch を回避するため、
--   呼出元 (Node TS lib/audit/hash-chain.ts) が確定済 canonical 文字列を p_canonical で渡し、
--   それを直接 SHA-256 にかけて curr_hash を求める。
--   p_canonical = NULL の場合は従来トリガ経路 (audit_log_compute_hash) にフォールバック。
create or replace function public.append_audit_log(
  p_tenant_id  uuid,
  p_actor_kind text,
  p_actor_id   text,
  p_event_kind text,
  p_resource   text,
  p_payload    jsonb,
  p_canonical  text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prev_hash    text;
  v_id           bigint;
  v_attempt      int := 0;
  v_max_retry    int := 3;
  v_canonical    text;
  v_curr_hash    text;
begin
  -- P0-1: tenant 単位の advisory lock で同一テナント内 INSERT を完全直列化。
  -- xact_lock はトランザクション終了で自動解放される。
  perform pg_advisory_xact_lock(hashtext('audit_log:' || p_tenant_id::text));

  loop
    v_attempt := v_attempt + 1;

    select coalesce(curr_hash, repeat('0', 64))
      into v_prev_hash
      from public.audit_log
     where tenant_id = p_tenant_id
     order by id desc
     limit 1
     for update;

    if v_prev_hash is null then
      v_prev_hash := repeat('0', 64);
    end if;

    -- P0-2: Node 側 canonical 文字列が渡されていれば、prev_hash を結合して直接 hash 計算。
    -- canonical 形式: tenant|ts|actor_kind|actor_id|event_kind|resource|payload_canonical
    -- (prev_hash はここで結合する。Node 側 canonicalize() は prev_hash 含むので、
    --  v_canonical はそのまま採用)
    if p_canonical is not null then
      v_canonical := p_canonical;
      v_curr_hash := encode(digest(v_canonical, 'sha256'), 'hex');
    end if;

    begin
      if p_canonical is not null then
        -- Node 側で確定した curr_hash を使い、トリガ側の再計算を bypass する経路。
        -- audit_log_compute_hash トリガが上書きするのを防ぐため、session GUC を立てる。
        perform set_config('audit_log.use_provided_hash', 'true', true);
        perform set_config('audit_log.provided_hash', v_curr_hash, true);
      else
        perform set_config('audit_log.use_provided_hash', 'false', true);
        perform set_config('audit_log.provided_hash', '', true);
      end if;

      insert into public.audit_log (
        tenant_id, actor_kind, actor_id, event_kind, resource, payload, prev_hash, curr_hash
      ) values (
        p_tenant_id, p_actor_kind, p_actor_id, p_event_kind, p_resource, p_payload, v_prev_hash,
        coalesce(v_curr_hash, '')
      )
      returning id into v_id;

      return v_id;
    exception
      when unique_violation then
        if v_attempt >= v_max_retry then
          raise exception 'append_audit_log: hash chain unique_violation after % attempts (tenant=%)',
            v_attempt, p_tenant_id
            using errcode = '40001';
        end if;
        -- 競合時は loop 継続 (上の SELECT で新しい prev_hash 取得)
    end;
  end loop;
end;
$$;

revoke all on function public.append_audit_log(uuid, text, text, text, text, jsonb, text) from public;
-- 旧シグネチャ (p_canonical なし) も明示 revoke (置換時の残存対策)
do $$ begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'append_audit_log'
      and pg_get_function_identity_arguments(p.oid) = 'uuid, text, text, text, text, jsonb'
  ) then
    execute 'revoke all on function public.append_audit_log(uuid, text, text, text, text, jsonb) from public';
  end if;
end $$;
