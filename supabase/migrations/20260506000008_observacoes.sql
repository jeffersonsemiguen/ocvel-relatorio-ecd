create table if not exists observacoes (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('fechamento','declaracao')),
  entidade_id uuid not null,
  conteudo text not null,
  usuario_id uuid not null references auth.users(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_observacoes_entidade on observacoes(entidade_tipo, entidade_id) where ativo = true;
create index idx_observacoes_usuario on observacoes(usuario_id);
