do $$
begin
  create type public.order_status as enum (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'refunded',
    'in_process'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  payment_id text not null unique,
  customer_name text not null,
  customer_email text not null,
  quantity integer not null check (quantity > 0),
  amount numeric(10, 2) not null check (amount > 0),
  status public.order_status not null default 'pending',
  payment_method text not null default 'pix' check (payment_method = 'pix'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pedidos
  add column if not exists payment_id text,
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists quantity integer,
  add column if not exists amount numeric(10, 2),
  add column if not exists status public.order_status default 'pending',
  add column if not exists payment_method text default 'pix',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists pedidos_payment_id_key on public.pedidos (payment_id);
create index if not exists pedidos_status_idx on public.pedidos (status);
create index if not exists pedidos_created_at_idx on public.pedidos (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pedidos_updated_at on public.pedidos;
create trigger set_pedidos_updated_at
before update on public.pedidos
for each row
execute function public.set_updated_at();

alter table public.pedidos enable row level security;
