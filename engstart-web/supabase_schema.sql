-- Chạy toàn bộ lệnh này trong Supabase -> SQL Editor -> New Query -> Run
create table if not exists public.engstart_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_email text,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- Bật bảo mật theo từng tài khoản Gmail (Row Level Security)
alter table public.engstart_progress enable row level security;

create policy "Users can view own progress"
  on public.engstart_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.engstart_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.engstart_progress for update
  using (auth.uid() = user_id);
