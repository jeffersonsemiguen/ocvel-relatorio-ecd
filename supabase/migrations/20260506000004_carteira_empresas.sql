create table if not exists carteira_empresas (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  papel text not null check (papel in ('analista','consultoria')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, empresa_id)
);

create index idx_carteira_usuario on carteira_empresas(usuario_id) where ativo = true;
create index idx_carteira_empresa on carteira_empresas(empresa_id) where ativo = true;
