create table if not exists fechamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete restrict,
  ano integer not null,
  periodo text not null check (periodo in ('T1','T2','T3','T4','ANUAL')),
  status text not null default 'zerado' check (status in ('zerado','em_analise','aprovado','reprovado','entregue','retificacao_pendente')),
  origem text not null default 'webhook' check (origem in ('webhook','manual')),
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, ano, periodo)
);

create table if not exists fechamento_versoes (
  id uuid primary key default gen_random_uuid(),
  fechamento_id uuid not null references fechamentos(id) on delete cascade,
  numero_versao integer not null default 0,
  bloqueada boolean not null default false,
  valores jsonb,
  storage_path_prefix text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  unique (fechamento_id, numero_versao)
);

create index idx_fechamentos_empresa_ano on fechamentos(empresa_id, ano);
create index idx_fechamentos_status on fechamentos(status);
create index idx_versoes_fechamento on fechamento_versoes(fechamento_id, numero_versao);
