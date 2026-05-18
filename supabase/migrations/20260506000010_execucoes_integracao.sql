create table if not exists execucoes_integracao (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'zeramento',
  chave_idempotencia text not null unique,
  status text not null check (status in ('sucesso','erro','duplicado','timeout','em_andamento')),
  payload_recebido jsonb,
  resultado jsonb,
  origem text not null default 'webhook' check (origem in ('webhook','manual')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_execucoes_chave on execucoes_integracao(chave_idempotencia);
create index idx_execucoes_status on execucoes_integracao(status);
