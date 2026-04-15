-- ─────────────────────────────────────────────────────────────────────────────
-- Table: prompts
-- Custom prompts created by users, shared across the whole team.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id            text        primary key,
  title         text        not null,
  description   text        not null default '',
  category      text        not null,
  brand         text        not null,
  tone          text        not null,
  tags          text[]      not null default '{}',
  content       text        not null,
  variables     text[],
  model         text,
  created_by    text,
  created_by_id uuid        references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_by    text,
  updated_by_id uuid        references auth.users(id) on delete set null,
  updated_at    timestamptz
);

alter table public.prompts enable row level security;

-- Any authenticated user can read all custom prompts
create policy "prompts_select"
  on public.prompts for select
  to authenticated using (true);

-- Any authenticated user can create prompts
create policy "prompts_insert"
  on public.prompts for insert
  to authenticated with check (created_by_id = auth.uid());

-- Any authenticated user can edit any prompt (per business requirements)
create policy "prompts_update"
  on public.prompts for update
  to authenticated using (true);

-- Only the creator or an admin can delete
create policy "prompts_delete"
  on public.prompts for delete
  to authenticated using (
    created_by_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: hidden_catalog_prompts
-- IDs of static-catalog prompts hidden by admins.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.hidden_catalog_prompts (
  catalog_id text        primary key,
  hidden_by  uuid        references auth.users(id) on delete set null,
  hidden_at  timestamptz not null default now()
);

alter table public.hidden_catalog_prompts enable row level security;

-- Any authenticated user can read hidden list (needed to filter catalog)
create policy "hidden_catalog_select"
  on public.hidden_catalog_prompts for select
  to authenticated using (true);

-- Only admins can hide catalog prompts
create policy "hidden_catalog_insert"
  on public.hidden_catalog_prompts for insert
  to authenticated with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can restore catalog prompts
create policy "hidden_catalog_delete"
  on public.hidden_catalog_prompts for delete
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
