create table if not exists declaracoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete restrict,
  ano integer not null,
  tipo_declaracao text not null check (tipo_declaracao in ('ECD','ECF')),
  status text not null default 'pendente' check (status in ('pendente','zerado','em_analise','aprovado','transmitido','retificacao_pendente','retificada')),
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, ano, tipo_declaracao)
);

create table if not exists declaracao_versoes (
  id uuid primary key default gen_random_uuid(),
  declaracao_id uuid not null references declaracoes(id) on delete cascade,
  numero_versao integer not null default 0,
  bloqueada boolean not null default false,
  hash_anterior text,
  valores jsonb,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  unique (declaracao_id, numero_versao)
);

create index idx_declaracoes_empresa_ano on declaracoes(empresa_id, ano);
create index idx_declaracoes_status on declaracoes(status);
create index idx_versoes_declaracao on declaracao_versoes(declaracao_id, numero_versao);
