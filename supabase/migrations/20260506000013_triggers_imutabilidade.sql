create or replace function trg_versao_imutavel()
returns trigger language plpgsql as $$
begin
  if old.bloqueada = true
     and (new.valores is distinct from old.valores
       or new.numero_versao is distinct from old.numero_versao) then
    raise exception 'Versao bloqueada: alteracao nao permitida (versao_id=%)', old.id
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_fechamento_versao_imutavel on fechamento_versoes;
create trigger trg_fechamento_versao_imutavel
  before update on fechamento_versoes
  for each row execute function trg_versao_imutavel();

drop trigger if exists trg_declaracao_versao_imutavel on declaracao_versoes;
create trigger trg_declaracao_versao_imutavel
  before update on declaracao_versoes
  for each row execute function trg_versao_imutavel();

create or replace function trg_validar_transicao_status()
returns trigger language plpgsql as $$
declare
  v_bypass text;
begin
  v_bypass := current_setting('app.bypass_status', true);
  if v_bypass = 'on' then
    return new;
  end if;
  if new.status_anterior is not null then
    if not exists (
      select 1 from _transicoes_validas
      where entidade_tipo = new.entidade_tipo
        and status_anterior = new.status_anterior
        and status_novo = new.status_novo
    ) then
      raise exception 'Transicao de status invalida: % -> % para %',
        new.status_anterior, new.status_novo, new.entidade_tipo
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_validar_transicao on historico_status;
create trigger trg_validar_transicao
  before insert on historico_status
  for each row execute function trg_validar_transicao_status();
