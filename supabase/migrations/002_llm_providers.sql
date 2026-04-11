-- 多执笔后端：扩展 provider、可选自定义 API 根路径、每用户当前选用设置

alter table public.user_provider_credentials drop constraint if exists user_provider_credentials_provider_check;

alter table public.user_provider_credentials
  add constraint user_provider_credentials_provider_check check (
    provider = any (
      array[
        'openai',
        'openrouter',
        'anthropic',
        'minimax',
        'kimi',
        'doubao',
        'jm',
        'jiminai'
      ]::text[]
    )
  );

alter table public.user_provider_credentials add column if not exists api_base_url text;

-- ---------- user_llm_settings：当前选用的后端与默认模型 ----------
create table if not exists public.user_llm_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_provider text not null default 'openai',
  default_model text,
  updated_at timestamptz not null default now(),
  constraint user_llm_settings_provider_check check (
    active_provider = any (
      array[
        'openai',
        'openrouter',
        'anthropic',
        'minimax',
        'kimi',
        'doubao',
        'jm',
        'jiminai'
      ]::text[]
    )
  )
);

alter table public.user_llm_settings enable row level security;

create policy "llm_settings_select_own" on public.user_llm_settings for select using (auth.uid() = user_id);

create policy "llm_settings_insert_own" on public.user_llm_settings for insert with check (auth.uid() = user_id);

create policy "llm_settings_update_own" on public.user_llm_settings for update using (auth.uid() = user_id);

create policy "llm_settings_delete_own" on public.user_llm_settings for delete using (auth.uid() = user_id);
