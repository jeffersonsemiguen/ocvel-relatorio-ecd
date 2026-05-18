create table if not exists historico_status (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('fechamento','declaracao')),
  entidade_id uuid not null,
  status_anterior text,
  status_novo text not null,
  usuario_id uuid references auth.users(id),
  observacao text,
  criado_em timestamptz not null default now()
);

create table if not exists _transicoes_validas (
  entidade_tipo text not null,
  status_anterior text not null,
  status_novo text not null,
  primary key (entidade_tipo, status_anterior, status_novo)
);

insert into _transicoes_validas (entidade_tipo, status_anterior, status_novo) values
  ('fechamento', 'zerado', 'em_analise'),
  ('fechamento', 'zerado', 'reprovado'),
  ('fechamento', 'em_analise', 'aprovado'),
  ('fechamento', 'em_analise', 'reprovado'),
  ('fechamento', 'aprovado', 'entregue'),
  ('fechamento', 'aprovado', 'reprovado'),
  ('fechamento', 'entregue', 'retificacao_pendente'),
  ('fechamento', 'reprovado', 'em_analise'),
  ('fechamento', 'retificacao_pendente', 'em_analise'),
  ('declaracao', 'pendente', 'zerado'),
  ('declaracao', 'zerado', 'em_analise'),
  ('declaracao', 'em_analise', 'aprovado'),
  ('declaracao', 'em_analise', 'zerado'),
  ('declaracao', 'aprovado', 'transmitido'),
  ('declaracao', 'aprovado', 'em_analise'),
  ('declaracao', 'transmitido', 'retificacao_pendente'),
  ('declaracao', 'retificacao_pendente', 'retificada'),
  ('declaracao', 'retificada', 'em_analise')
on conflict do nothing;

create index idx_historico_entidade on historico_status(entidade_tipo, entidade_id, criado_em desc);
