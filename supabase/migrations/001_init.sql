-- 圆桌 + BYOK（RLS）；在 Supabase SQL 编辑器或 CLI 执行

create extension if not exists "pgcrypto";

-- ---------- user_provider_credentials ----------
create table if not exists public.user_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('openai')),
  ciphertext text not null,
  label text,
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.user_provider_credentials enable row level security;

create policy "credentials_select_own"
  on public.user_provider_credentials for select
  using (auth.uid() = user_id);

create policy "credentials_insert_own"
  on public.user_provider_credentials for insert
  with check (auth.uid() = user_id);

create policy "credentials_update_own"
  on public.user_provider_credentials for update
  using (auth.uid() = user_id);

create policy "credentials_delete_own"
  on public.user_provider_credentials for delete
  using (auth.uid() = user_id);

-- ---------- roundtable_sessions ----------
create table if not exists public.roundtable_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  participant_skill_ids text[] not null default '{}',
  max_rounds int not null default 4,
  current_round int not null default 0,
  phase text not null default 'idle',
  moderator_memory text not null default '',
  synthesis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.roundtable_sessions enable row level security;

create policy "sessions_all_own"
  on public.roundtable_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- roundtable_messages ----------
create table if not exists public.roundtable_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.roundtable_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  skill_id text,
  content text not null,
  content_hash text,
  position_idx int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists roundtable_messages_session_id_idx
  on public.roundtable_messages (session_id);

create index if not exists roundtable_messages_session_pos_idx
  on public.roundtable_messages (session_id, position_idx);

alter table public.roundtable_messages enable row level security;

create policy "messages_all_own"
  on public.roundtable_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
