-- 移除未提供稳定默认端点的执笔类型，避免砚台出现无效选项
-- 若尚未执行 002，可能无 user_llm_settings，故用条件块兼容。

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'user_llm_settings'
  ) then
    update public.user_llm_settings
    set active_provider = 'openai', updated_at = now()
    where active_provider in ('jm', 'jiminai');
  end if;
end $$;

delete from public.user_provider_credentials
where provider in ('jm', 'jiminai');

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
        'doubao'
      ]::text[]
    )
  );

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'user_llm_settings'
  ) then
    alter table public.user_llm_settings drop constraint if exists user_llm_settings_provider_check;

    alter table public.user_llm_settings
      add constraint user_llm_settings_provider_check check (
        active_provider = any (
          array[
            'openai',
            'openrouter',
            'anthropic',
            'minimax',
            'kimi',
            'doubao'
          ]::text[]
        )
      );
  end if;
end $$;
