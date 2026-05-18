create table if not exists usuarios_perfis (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  perfil text not null check (perfil in ('analista','consultoria','gestor','admin')),
  nome_completo text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios_perfis (usuario_id, nome_completo, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_completo', new.email, 'Novo Usuário'),
    coalesce(new.raw_user_meta_data->>'perfil', 'analista')
  )
  on conflict (usuario_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
