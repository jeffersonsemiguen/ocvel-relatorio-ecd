create table if not exists anexos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('fechamento','declaracao')),
  entidade_id uuid not null,
  tipo_documento text not null check (tipo_documento in ('DRE','BALANCO','DMPL','DFC','DRA','RECIBO_ECD','RECIBO_ECF')),
  storage_path text not null,
  nome_arquivo text,
  tamanho_bytes integer,
  enviado_por uuid references auth.users(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index idx_anexos_entidade on anexos(entidade_tipo, entidade_id) where ativo = true;
