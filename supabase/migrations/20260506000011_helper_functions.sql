create or replace function usuario_tem_empresa(p_empresa_id uuid)
returns bool language sql security definer stable as $$
  select exists (
    select 1 from carteira_empresas
    where usuario_id = auth.uid()
      and empresa_id = p_empresa_id
      and ativo = true
  ) or exists (
    select 1 from usuarios_perfis
    where usuario_id = auth.uid()
      and perfil in ('gestor','admin')
  );
$$;

create or replace function auth_perfil()
returns text language sql security definer stable as $$
  select coalesce(
    (select perfil from usuarios_perfis where usuario_id = auth.uid()),
    'analista'
  );
$$;
