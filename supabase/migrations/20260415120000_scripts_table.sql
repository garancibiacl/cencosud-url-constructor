-- ─────────────────────────────────────────────────────────────────────────────
-- Table: scripts
-- Scripts .jsx subidos por usuarios, compartidos con todo el equipo.
-- El código JSX se guarda como texto plano (máx ~100 KB por restricción de app).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.scripts (
  id              text        primary key,
  title           text        not null,
  description     text        not null default '',
  app             text        not null,
  tags            text[]      not null default '{}',
  prompt          text        not null default '',
  code            text        not null,
  filename        text        not null,
  uploaded_by     text,
  uploaded_by_id  uuid        references auth.users(id) on delete set null,
  uploaded_at     timestamptz not null default now(),
  updated_by      text,
  updated_by_id   uuid        references auth.users(id) on delete set null,
  updated_at      timestamptz
);

alter table public.scripts enable row level security;

-- Cualquier usuario autenticado puede leer todos los scripts
create policy "scripts_select"
  on public.scripts for select
  to authenticated using (true);

-- Cualquier usuario autenticado puede subir scripts
create policy "scripts_insert"
  on public.scripts for insert
  to authenticated with check (uploaded_by_id = auth.uid());

-- Cualquier usuario autenticado puede editar scripts
create policy "scripts_update"
  on public.scripts for update
  to authenticated using (true);

-- Solo admin puede eliminar
create policy "scripts_delete"
  on public.scripts for delete
  to authenticated using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
