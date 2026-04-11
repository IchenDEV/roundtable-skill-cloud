-- 为圆桌会话补充 mode 持久化，并以单个事务替换整席消息写入，避免“先删后写”损坏旧席记录。

alter table public.roundtable_sessions add column if not exists mode text not null default 'discussion';

alter table public.roundtable_sessions drop constraint if exists roundtable_sessions_mode_check;

alter table public.roundtable_sessions
  add constraint roundtable_sessions_mode_check check (mode in ('discussion', 'debate'));

create or replace function public.persist_roundtable_state(
  p_session_id uuid,
  p_topic text,
  p_mode text,
  p_participant_skill_ids text[],
  p_max_rounds int,
  p_current_round int,
  p_phase text,
  p_moderator_memory text,
  p_synthesis text,
  p_messages jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'persist_roundtable_state requires auth';
  end if;

  insert into public.roundtable_sessions (
    id,
    user_id,
    topic,
    mode,
    participant_skill_ids,
    max_rounds,
    current_round,
    phase,
    moderator_memory,
    synthesis,
    updated_at
  )
  values (
    p_session_id,
    v_user_id,
    p_topic,
    p_mode,
    coalesce(p_participant_skill_ids, '{}'::text[]),
    p_max_rounds,
    p_current_round,
    p_phase,
    coalesce(p_moderator_memory, ''),
    p_synthesis,
    now()
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    topic = excluded.topic,
    mode = excluded.mode,
    participant_skill_ids = excluded.participant_skill_ids,
    max_rounds = excluded.max_rounds,
    current_round = excluded.current_round,
    phase = excluded.phase,
    moderator_memory = excluded.moderator_memory,
    synthesis = excluded.synthesis,
    updated_at = excluded.updated_at;

  delete from public.roundtable_messages
  where session_id = p_session_id
    and user_id = v_user_id;

  if jsonb_typeof(coalesce(p_messages, '[]'::jsonb)) = 'array' and jsonb_array_length(coalesce(p_messages, '[]'::jsonb)) > 0 then
    insert into public.roundtable_messages (
      session_id,
      user_id,
      role,
      skill_id,
      content,
      content_hash,
      position_idx
    )
    select
      p_session_id,
      v_user_id,
      m.role,
      m.skill_id,
      m.content,
      m.content_hash,
      m.position_idx
    from jsonb_to_recordset(p_messages) as m(
      role text,
      skill_id text,
      content text,
      content_hash text,
      position_idx int
    );
  end if;
end;
$$;
