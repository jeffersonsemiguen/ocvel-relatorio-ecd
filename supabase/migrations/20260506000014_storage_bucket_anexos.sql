insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anexos',
  'anexos',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do nothing;

create policy "storage_anexos_select" on storage.objects for select
  using (
    bucket_id = 'anexos' and
    auth.uid() is not null and
    (
      auth_perfil() in ('gestor','admin') or
      exists (
        select 1 from anexos a
        where a.storage_path = name
          and a.ativo = true
          and (
            (a.entidade_tipo = 'fechamento' and exists (
              select 1 from fechamentos f
              where f.id = a.entidade_id
                and usuario_tem_empresa(f.empresa_id)
            )) or
            (a.entidade_tipo = 'declaracao' and exists (
              select 1 from declaracoes d
              where d.id = a.entidade_id
                and usuario_tem_empresa(d.empresa_id)
            ))
          )
      )
    )
  );

create policy "storage_anexos_insert" on storage.objects for insert
  with check (
    bucket_id = 'anexos' and
    auth.uid() is not null
  );
