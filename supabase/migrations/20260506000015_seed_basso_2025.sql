insert into empresas (id, codigo_empresa, cnpj, razao_social, nome_fantasia, regime_tributario)
values (
  gen_random_uuid(),
  'BASSO',
  '00.000.000/0001-00',
  'BASSO CONTABILIDADE LTDA',
  'Basso',
  'lucro_real'
)
on conflict (codigo_empresa) do nothing;

insert into empresa_periodicidade (empresa_id, ano, periodicidade)
select id, 2025, 'ANUAL'
from empresas
where codigo_empresa = 'BASSO'
on conflict (empresa_id, ano) do nothing;
