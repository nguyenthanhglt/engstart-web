-- Chạy đoạn SQL này trong Supabase -> SQL Editor -> New Query -> Run
create table if not exists engstart_progress (
  user_email text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- Bật quyền đọc/ghi nhanh cho bản thử nghiệm (MVP)
alter table engstart_progress disable row level security;
