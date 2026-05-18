create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  codigo_empresa text not null unique,
  cnpj text not null unique,
  razao_social text not null,
  nome_fantasia text,
  regime_tributario text not null check (regime_tributario in ('lucro_real','lucro_presumido','simples_nacional')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists empresa_periodicidade (
  empresa_id uuid not null references empresas(id) on delete cascade,
  ano integer not null,
  periodicidade text not null check (periodicidade in ('TRIMESTRAL','ANUAL')),
  primary key (empresa_id, ano)
);

create index idx_empresas_codigo on empresas(codigo_empresa);
create index idx_empresas_cnpj on empresas(cnpj);
create index idx_empresa_periodicidade_ano on empresa_periodicidade(empresa_id, ano);
