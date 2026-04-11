-- 圆桌公开分享快照：仅由 Next.js 服务端以 service_role 读写；无面向 anon 的 RLS 策略。

create table if not exists public.roundtable_share_snapshots (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  owner_id uuid references auth.users (id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists roundtable_share_snapshots_token_idx
  on public.roundtable_share_snapshots (token);

alter table public.roundtable_share_snapshots enable row level security;
