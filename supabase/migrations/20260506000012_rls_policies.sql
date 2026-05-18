alter table empresas enable row level security;
alter table empresa_periodicidade enable row level security;
alter table usuarios_perfis enable row level security;
alter table carteira_empresas enable row level security;
alter table fechamentos enable row level security;
alter table fechamento_versoes enable row level security;
alter table declaracoes enable row level security;
alter table declaracao_versoes enable row level security;
alter table historico_status enable row level security;
alter table observacoes enable row level security;
alter table anexos enable row level security;
alter table execucoes_integracao enable row level security;

-- empresas
create policy "empresas_select" on empresas for select
  using (usuario_tem_empresa(id));

-- empresa_periodicidade
create policy "empresa_periodicidade_select" on empresa_periodicidade for select
  using (usuario_tem_empresa(empresa_id));

-- usuarios_perfis: usuário vê apenas o próprio perfil; admin vê todos
create policy "usuarios_perfis_select_own" on usuarios_perfis for select
  using (usuario_id = auth.uid() or auth_perfil() = 'admin');

create policy "usuarios_perfis_insert_own" on usuarios_perfis for insert
  with check (usuario_id = auth.uid());

create policy "usuarios_perfis_update_own" on usuarios_perfis for update
  using (usuario_id = auth.uid() or auth_perfil() = 'admin')
  with check (usuario_id = auth.uid() or auth_perfil() = 'admin');

-- carteira_empresas
create policy "carteira_select_own" on carteira_empresas for select
  using (usuario_id = auth.uid() or auth_perfil() in ('gestor','admin'));

create policy "carteira_insert_admin" on carteira_empresas for insert
  with check (auth_perfil() = 'admin');

create policy "carteira_update_admin" on carteira_empresas for update
  using (auth_perfil() = 'admin');

-- fechamentos
create policy "fechamentos_select_carteira" on fechamentos for select
  using (usuario_tem_empresa(empresa_id));

create policy "fechamentos_insert_carteira" on fechamentos for insert
  with check (usuario_tem_empresa(empresa_id));

create policy "fechamentos_update_carteira" on fechamentos for update
  using (usuario_tem_empresa(empresa_id))
  with check (usuario_tem_empresa(empresa_id));

-- fechamento_versoes
create policy "fechamento_versoes_select" on fechamento_versoes for select
  using (
    exists (
      select 1 from fechamentos f
      where f.id = fechamento_id
        and usuario_tem_empresa(f.empresa_id)
    )
  );

create policy "fechamento_versoes_insert" on fechamento_versoes for insert
  with check (
    exists (
      select 1 from fechamentos f
      where f.id = fechamento_id
        and usuario_tem_empresa(f.empresa_id)
    )
  );

create policy "fechamento_versoes_update" on fechamento_versoes for update
  using (
    bloqueada = false and exists (
      select 1 from fechamentos f
      where f.id = fechamento_id
        and usuario_tem_empresa(f.empresa_id)
    )
  );

-- declaracoes
create policy "declaracoes_select" on declaracoes for select
  using (usuario_tem_empresa(empresa_id));

create policy "declaracoes_insert" on declaracoes for insert
  with check (usuario_tem_empresa(empresa_id));

create policy "declaracoes_update" on declaracoes for update
  using (usuario_tem_empresa(empresa_id))
  with check (usuario_tem_empresa(empresa_id));

-- declaracao_versoes
create policy "declaracao_versoes_select" on declaracao_versoes for select
  using (
    exists (
      select 1 from declaracoes d
      where d.id = declaracao_id
        and usuario_tem_empresa(d.empresa_id)
    )
  );

create policy "declaracao_versoes_insert" on declaracao_versoes for insert
  with check (
    exists (
      select 1 from declaracoes d
      where d.id = declaracao_id
        and usuario_tem_empresa(d.empresa_id)
    )
  );

-- historico_status: append-only para todos; gestor/admin leem tudo
create policy "historico_insert" on historico_status for insert
  with check (auth.uid() is not null);

create policy "historico_select" on historico_status for select
  using (
    auth_perfil() in ('gestor','admin') or
    (
      entidade_tipo = 'fechamento' and exists (
        select 1 from fechamentos f
        where f.id = entidade_id
          and usuario_tem_empresa(f.empresa_id)
      )
    ) or
    (
      entidade_tipo = 'declaracao' and exists (
        select 1 from declaracoes d
        where d.id = entidade_id
          and usuario_tem_empresa(d.empresa_id)
      )
    )
  );

-- observacoes
create policy "observacoes_select" on observacoes for select
  using (
    ativo = true and (
      (entidade_tipo = 'fechamento' and exists (
        select 1 from fechamentos f
        where f.id = entidade_id and usuario_tem_empresa(f.empresa_id)
      )) or
      (entidade_tipo = 'declaracao' and exists (
        select 1 from declaracoes d
        where d.id = entidade_id and usuario_tem_empresa(d.empresa_id)
      ))
    )
  );

create policy "observacoes_insert" on observacoes for insert
  with check (
    usuario_id = auth.uid() and (
      (entidade_tipo = 'fechamento' and exists (
        select 1 from fechamentos f
        where f.id = entidade_id and usuario_tem_empresa(f.empresa_id)
      )) or
      (entidade_tipo = 'declaracao' and exists (
        select 1 from declaracoes d
        where d.id = entidade_id and usuario_tem_empresa(d.empresa_id)
      ))
    )
  );

create policy "observacoes_update_own" on observacoes for update
  using (usuario_id = auth.uid() or auth_perfil() = 'admin');

-- anexos
create policy "anexos_select" on anexos for select
  using (
    ativo = true and (
      (entidade_tipo = 'fechamento' and exists (
        select 1 from fechamentos f
        where f.id = entidade_id and usuario_tem_empresa(f.empresa_id)
      )) or
      (entidade_tipo = 'declaracao' and exists (
        select 1 from declaracoes d
        where d.id = entidade_id and usuario_tem_empresa(d.empresa_id)
      ))
    )
  );

create policy "anexos_insert" on anexos for insert
  with check (
    (entidade_tipo = 'fechamento' and exists (
      select 1 from fechamentos f
      where f.id = entidade_id and usuario_tem_empresa(f.empresa_id)
    )) or
    (entidade_tipo = 'declaracao' and exists (
      select 1 from declaracoes d
      where d.id = entidade_id and usuario_tem_empresa(d.empresa_id)
    ))
  );

-- execucoes_integracao: apenas gestor/admin leem; service_role insere
create policy "execucoes_select_gestor" on execucoes_integracao for select
  using (auth_perfil() in ('gestor','admin'));
