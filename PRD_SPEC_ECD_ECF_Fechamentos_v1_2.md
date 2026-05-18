# PRD + SPEC Consolidado — Painel de Controle ECD/ECF e Fechamentos Contábeis

**Versão:** v1.2  
**Formato:** Markdown  
**Projeto:** Painel de Controle ECD/ECF e Fechamentos Contábeis  
**Stack sugerida:** Lovable/Skip + Supabase + n8n + Banco Contábil  

---

## 1. Contexto

Atualmente, o controle auxiliar para entrega das obrigações **ECD** e **ECF** é feito manualmente em planilha/relatório. Esse controle reúne informações como empresa, NIRE, CNPJ, livro, datas do período, data de zeramento, DRE, Balanço, DMPL, DFC, DRA, ano, ECD e ECF.

Já existe um `select` inicial que busca boa parte dessas informações no banco contábil, incluindo dados cadastrais, livro, período, DRE, Balanço, DMPL, DFC, ano e campos reservados para zeramento, DRA, ECD e ECF. Hoje o select está com parâmetros fixos para teste, mas deve evoluir para parâmetros dinâmicos.

Além disso, algumas empresas possuem **zeramento trimestral**, o que exige que o sistema controle fechamentos por período:

```text
1º Trim
2º Trim
3º Trim
4º Trim
Anual
```

A entrega das declarações ECD/ECF continua sendo anual. Portanto, o sistema deve separar:

```text
Fechamento contábil por período
≠
Controle da declaração anual ECD/ECF
```

---

## 2. Objetivo do produto

Criar um sistema web para controlar, automatizar e auditar o processo de:

1. fechamentos contábeis anuais e trimestrais;
2. análise dos demonstrativos;
3. acompanhamento das declarações ECD e ECF;
4. controle de versões original e retificações;
5. controle de responsáveis, status, PDFs, observações e logs.

---

## 3. Visão da solução

```text
gClick
  ↓ Webhook de zeramento
n8n
  ↓ Validação, execução do select e orquestração
Banco contábil
  ↓ Dados contábeis parametrizados por período
Supabase
  ↓ Banco principal, permissões, arquivos, logs e histórico
Frontend Lovable/Skip
  ↓ Dashboard de fechamentos e dashboard de declarações
```

### Decisão recomendada

| Item | Decisão |
|---|---|
| Frontend | Lovable para MVP, ou Skip se atender melhor à equipe |
| Banco principal | Supabase PostgreSQL |
| Arquivos/PDFs | Supabase Storage |
| Orquestração | n8n |
| n8n Data Tables | Apenas apoio interno, não banco principal |
| Banco contábil | Acessado somente pelo n8n/backend |
| Permissões | Supabase Auth + RLS |
| Histórico | Obrigatório desde o MVP |
| Declarações ECD/ECF | Controle anual |
| Fechamentos trimestrais | Controle operacional/contábil |

---

## 4. Conceitos principais

### 4.1 Empresa

Entidade controlada no sistema.

Exemplo:

```text
Empresa: BASSO EMPREENDIMENTOS IMOBILIÁRIOS LTDA
CNPJ: 21.975.559/0001-07
Ano: 2025
```

---

### 4.2 Periodicidade da empresa

Cada empresa pode ter periodicidade por ano:

```text
ANUAL
TRIMESTRAL
```

#### Empresa anual

Gera apenas:

```text
Anual
```

#### Empresa trimestral

Gera:

```text
1º Trim
2º Trim
3º Trim
4º Trim
Anual
```

---

### 4.3 Fechamento

Representa o zeramento/análise contábil de um período.

Exemplos:

```text
Empresa 710 | 2025 | 1º Trim
Empresa 710 | 2025 | 2º Trim
Empresa 710 | 2025 | 3º Trim
Empresa 710 | 2025 | 4º Trim
Empresa 710 | 2025 | Anual
```

Cada fechamento possui:

```text
status de fechamento
data de zeramento
usuário do zeramento
valores contábeis
PDFs
observações
histórico
versões
```

---

### 4.4 Declaração

Representa o controle da obrigação **ECD** ou **ECF**.

A declaração é anual:

```text
Empresa 710 | 2025 | ECD
Empresa 710 | 2025 | ECF
```

Para empresas trimestrais, o sistema usa os fechamentos trimestrais como apoio operacional, principalmente o **4º trimestre**, mas o controle final da entrega fica no **Anual**.

---

## 5. Regra consolidada: fechamento x declaração

| Período | Status de fechamento | Status ECD | Status ECF |
|---|---|---|---|
| 1º Trim | Sim | Não aplicável | Não aplicável |
| 2º Trim | Sim | Não aplicável | Não aplicável |
| 3º Trim | Sim | Não aplicável | Não aplicável |
| 4º Trim | Sim | Pré-controle/opcional | Pré-controle/opcional |
| Anual | Sim | Sim | Sim |

A declaração anual deve olhar para:

```text
Fechamento anual
+
4º trimestre, quando a empresa for trimestral
+
pendências dos períodos anteriores
```

---

## 6. Usuários e permissões

### 6.1 Analista

Pode:

```text
ver empresas da sua carteira
alterar status de fechamento
adicionar observações
visualizar PDFs
solicitar reprocessamento, se autorizado
```

Não pode:

```text
alterar obrigação entregue
excluir histórico
editar permissões
alterar carteira
```

---

### 6.2 Consultoria

Pode:

```text
visualizar declarações enviadas para consultoria
registrar parecer
adicionar observações
devolver com pendência
aprovar análise
```

---

### 6.3 Gestor

Pode:

```text
ver todas as empresas
alterar responsáveis
gerenciar carteira
liberar retificação
marcar declaração como entregue
consultar logs
reprocessar dados
```

---

### 6.4 Administrador

Pode:

```text
gerenciar usuários
gerenciar permissões
configurar integrações
configurar status
consultar logs técnicos
```

---

## 7. Requisitos funcionais

### RF01 — Receber webhook do gClick

O sistema deve receber evento do gClick quando ocorrer zeramento.

Payload sugerido:

```json
{
  "codigo_empresa": 710,
  "ano": 2025,
  "periodo_codigo": "T4",
  "periodo_nome": "4º Trim",
  "data_inicio": "2025-10-01",
  "data_fim": "2025-12-31",
  "data_fim_exclusiva": "2026-01-01",
  "data_zeramento": "2026-01-15",
  "usuario_zeramento": "usuario.gclick",
  "responsavel_ecd": "analista.ecd",
  "responsavel_ecf": "analista.ecf",
  "arquivos_pdf": []
}
```

Critérios de aceite:

```text
deve rejeitar evento sem empresa, ano ou período
deve registrar log da execução
deve impedir duplicidade indevida
deve salvar dados do zeramento
deve vincular PDFs ao período correto
```

---

### RF02 — Executar select parametrizado

O n8n deve executar o select com parâmetros dinâmicos:

```text
codigo_empresa
codigoplano
ano
periodo_codigo
data_inicio
data_fim_exclusiva
```

O select não deve decidir sozinho se o período é anual ou trimestral. Quem deve informar isso é o n8n, com base no webhook ou na configuração da empresa.

Critérios de aceite:

```text
não pode haver empresa, ano ou plano fixo em produção
o select deve aceitar intervalo de datas
DRE deve respeitar data inicial e data final
Balanço/DMPL/DFC devem seguir regra definida de saldo
cada execução deve gerar log
erro deve ser registrado
```

---

### RF03 — Controlar periodicidade da empresa

O sistema deve permitir configurar a periodicidade da empresa por ano.

Opções:

```text
ANUAL
TRIMESTRAL
```

Critérios de aceite:

```text
empresa anual gera apenas período anual
empresa trimestral gera T1, T2, T3, T4 e anual
mudança de periodicidade não apaga histórico
periodicidade pode variar por ano
```

---

### RF04 — Controlar fechamentos por período

Cada empresa/ano/período deve ter um fechamento.

Exemplo:

```text
Empresa 710 | 2025 | T1
Empresa 710 | 2025 | T2
Empresa 710 | 2025 | T3
Empresa 710 | 2025 | T4
Empresa 710 | 2025 | ANUAL
```

Critérios de aceite:

```text
não pode haver duplicidade para empresa + ano + período
cada período tem status próprio
cada período tem observações próprias
cada período tem PDFs próprios
cada período tem histórico próprio
```

---

### RF05 — Controlar declarações anuais ECD/ECF

Cada empresa/ano deve ter controle anual para:

```text
ECD
ECF
```

Critérios de aceite:

```text
ECD e ECF possuem status separados
alterar ECD não altera ECF automaticamente
a entrega é vinculada ao ano
a declaração pode consultar fechamento anual e 4º trimestre
status de declaração não precisa existir em T1, T2 e T3
```

---

### RF06 — Status de fechamento

Status sugeridos:

```text
Aguardando zeramento
Processando dados
Em análise
Com pendência
Com erro
Concluído
Reprocessamento solicitado
Retificação necessária
Não aplicável
```

---

### RF07 — Status de declaração

Status sugeridos para ECD e ECF:

```text
Aguardando fechamento anual
Aguardando 4º trimestre
Processando dados
Em análise
Com pendência
Com erro
Enviado para consultoria
Aguardando retorno da consultoria
Aprovado pela consultoria
Pronto para entrega
Entregue
Retificação necessária
Não aplicável
```

---

### RF08 — Controlar versões

O sistema deve preservar versões:

```text
Original
RET1
RET2
RET3
```

Regras:

```text
Original = número 0
RET1 = número 1
RET2 = número 2
RET3 = número 3
```

Critérios de aceite:

```text
versão entregue não deve ser sobrescrita
retificação cria nova versão
PDFs ficam vinculados à versão correta
observações ficam vinculadas à versão correta
valores históricos permanecem preservados
```

---

### RF09 — PDFs por demonstrativo

Cada fechamento pode ter PDFs vinculados a:

```text
DRE
Balanço
DMPL
DFC
DRA
Outros
```

Cada declaração pode ter PDFs/arquivos vinculados a:

```text
Recibo ECD
Recibo ECF
Comprovante
Outros
```

Critérios de aceite:

```text
botão PDF aparece apenas quando houver arquivo
PDF respeita permissão do usuário
PDF fica vinculado ao período, declaração e versão correta
```

---

### RF10 — Observações

O sistema deve permitir observações por:

```text
empresa
ano
período
fechamento
declaração
versão
status
```

Critérios de aceite:

```text
não apagar observações fisicamente
registrar usuário, data e hora
permitir histórico completo para gestores
```

---

### RF11 — Logs de execução

Cada execução do n8n deve gerar log.

Campos mínimos:

```text
origem
workflow
empresa
ano
período
data início
data fim
status
payload recebido
resultado
erro, se houver
quantidade de registros processados
```

---

### RF12 — Carteira de empresas

O sistema deve permitir carteira de empresas por usuário.

Critérios de aceite:

```text
analista só vê empresas da sua carteira
gestor vê todas
admin configura carteiras
a regra deve existir no banco, não apenas no frontend
```

---

## 8. Dashboards

### 8.1 Dashboard de fechamentos

Objetivo: controlar zeramentos e análises contábeis.

#### Linha principal

```text
Empresa | Ano | Periodicidade | Fechamentos | Responsável | Pendências | Última atualização
```

#### Exemplo visual

```text
BASSO EMPREENDIMENTOS IMOBILIÁRIOS LTDA | 2025 | Trimestral

[1ºT ✅] [2ºT ✅] [3ºT 🟡] [4ºT 🔵] [Anual ⚪]

Responsável: Maria
Pendências: 2
Última atualização: 30/04/2026
```

#### Ao clicar no período

```text
4º Trim 2025
Período: 01/10/2025 a 31/12/2025
Zeramento: 15/01/2026
Usuário zeramento: João

DRE:      R$ xxx.xxx,xx  [PDF]
Balanço:  R$ xxx.xxx,xx  [PDF]
DMPL:     R$ xxx.xxx,xx  [PDF]
DFC:      R$ xxx.xxx,xx  [PDF]
DRA:      —              [PDF]

Status fechamento: Em análise
Observações: ...
Histórico: ...
```

---

### 8.2 Dashboard de declarações

Objetivo: controlar ECD/ECF.

#### Linha principal

```text
Empresa | Ano | Periodicidade | Fechamentos | ECD | ECF | Responsável | Pendências | Última atualização
```

#### Exemplo visual

```text
BASSO EMPREENDIMENTOS IMOBILIÁRIOS LTDA | 2025

Fechamentos:
[1ºT ✅] [2ºT ✅] [3ºT ✅] [4ºT ✅] [Anual 🟡]

ECD: 🔵 Enviado para consultoria
ECF: 🟡 Em análise

Responsável: Maria
Pendências: 1
Última atualização: 30/04/2026
```

#### Cards superiores

```text
Total ECD
Total ECF
Aguardando fechamento anual
Aguardando 4º trimestre
Em análise
Enviado para consultoria
Com pendência
Com erro
Pronto para entrega
Entregue
```

#### Filtros

```text
Ano
Empresa
CNPJ
Periodicidade
Responsável
Status ECD
Status ECF
Somente com pendência
Somente com erro
Somente não entregue
Somente aguardando 4º trimestre
Somente pronto para entrega
Carteira
```

---

# SPEC Técnica Consolidada

## 9. Arquitetura

```text
[ gClick ]
    ↓
[ Webhook n8n ]
    ↓
[ Banco contábil ]
    ↓
[ Supabase PostgreSQL ]
    ↓
[ Supabase Storage ]
    ↓
[ Frontend Lovable/Skip ]
```

---

## 10. Modelo de dados sugerido

### 10.1 `empresas`

```sql
create table empresas (
  id uuid primary key default gen_random_uuid(),
  codigo_empresa integer not null unique,
  nire text,
  cnpj text,
  razao_social text not null,
  data_inicio date,
  ativo boolean default true,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);
```

---

### 10.2 `usuarios_perfis`

```sql
create table usuarios_perfis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text,
  email text not null,
  perfil text not null check (
    perfil in ('analista', 'consultoria', 'gestor', 'admin')
  ),
  ativo boolean default true,
  criado_em timestamptz default now()
);
```

---

### 10.3 `carteira_empresas`

```sql
create table carteira_empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  empresa_id uuid not null references empresas(id),
  papel text default 'analista',
  ativo boolean default true,
  criado_em timestamptz default now(),
  unique (user_id, empresa_id)
);
```

---

### 10.4 `empresa_periodicidade`

```sql
create table empresa_periodicidade (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  ano integer not null,
  periodicidade text not null check (
    periodicidade in ('ANUAL', 'TRIMESTRAL')
  ),
  gerar_anual_consolidado boolean default true,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique (empresa_id, ano)
);
```

---

### 10.5 `fechamentos`

Tabela central dos períodos.

```sql
create table fechamentos (
  id uuid primary key default gen_random_uuid(),

  empresa_id uuid not null references empresas(id),
  ano integer not null,

  periodo_codigo text not null check (
    periodo_codigo in ('T1', 'T2', 'T3', 'T4', 'ANUAL')
  ),

  periodo_nome text not null,

  data_inicio date not null,
  data_fim date not null,
  data_fim_exclusiva date not null,

  status_fechamento text not null default 'Aguardando zeramento',

  data_zeramento date,
  usuario_zeramento text,

  responsavel_id uuid,

  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),

  unique (empresa_id, ano, periodo_codigo)
);
```

---

### 10.6 `fechamento_versoes`

```sql
create table fechamento_versoes (
  id uuid primary key default gen_random_uuid(),

  fechamento_id uuid not null references fechamentos(id),

  tipo_versao text not null check (
    tipo_versao in ('ORIGINAL', 'RETIFICACAO')
  ),

  numero_versao integer not null,

  livro integer,
  data_inicial date,
  data_final date,

  dre numeric(18,2),
  balanco numeric(18,2),
  dmpl numeric(18,2),
  dfc numeric(18,2),
  dra numeric(18,2),

  criterio_dre text default 'PERIODO' check (
    criterio_dre in ('PERIODO', 'ACUMULADO_ANO')
  ),

  hash_resultado_select text,
  execucao_id uuid,

  bloqueada boolean default false,

  criado_em timestamptz default now(),

  unique (fechamento_id, numero_versao)
);
```

---

### 10.7 `declaracoes`

Tabela central do dashboard ECD/ECF.

```sql
create table declaracoes (
  id uuid primary key default gen_random_uuid(),

  empresa_id uuid not null references empresas(id),
  ano integer not null,

  tipo_declaracao text not null check (
    tipo_declaracao in ('ECD', 'ECF')
  ),

  fechamento_anual_id uuid references fechamentos(id),
  fechamento_4t_id uuid references fechamentos(id),

  status_atual text not null default 'Aguardando fechamento anual',

  responsavel_id uuid,

  data_envio_consultoria date,
  data_retorno_consultoria date,
  data_entrega date,

  recibo_storage_path text,

  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),

  unique (empresa_id, ano, tipo_declaracao)
);
```

---

### 10.8 `declaracao_versoes`

Para preservar original e retificações da declaração.

```sql
create table declaracao_versoes (
  id uuid primary key default gen_random_uuid(),

  declaracao_id uuid not null references declaracoes(id),

  tipo_versao text not null check (
    tipo_versao in ('ORIGINAL', 'RETIFICACAO')
  ),

  numero_versao integer not null,

  data_entrega date,
  recibo_numero text,
  recibo_storage_path text,

  execucao_id uuid,

  bloqueada boolean default false,

  criado_em timestamptz default now(),

  unique (declaracao_id, numero_versao)
);
```

---

### 10.9 `historico_status`

```sql
create table historico_status (
  id uuid primary key default gen_random_uuid(),

  fechamento_id uuid references fechamentos(id),
  fechamento_versao_id uuid references fechamento_versoes(id),

  declaracao_id uuid references declaracoes(id),
  declaracao_versao_id uuid references declaracao_versoes(id),

  tipo_status text not null check (
    tipo_status in ('FECHAMENTO', 'ECD', 'ECF')
  ),

  status_de text,
  status_para text not null,

  usuario_id uuid,
  observacao text,

  criado_em timestamptz default now()
);
```

---

### 10.10 `observacoes`

```sql
create table observacoes (
  id uuid primary key default gen_random_uuid(),

  empresa_id uuid references empresas(id),
  fechamento_id uuid references fechamentos(id),
  fechamento_versao_id uuid references fechamento_versoes(id),
  declaracao_id uuid references declaracoes(id),
  declaracao_versao_id uuid references declaracao_versoes(id),

  usuario_id uuid,

  observacao text not null,

  criado_em timestamptz default now()
);
```

---

### 10.11 `anexos`

```sql
create table anexos (
  id uuid primary key default gen_random_uuid(),

  empresa_id uuid references empresas(id),

  fechamento_id uuid references fechamentos(id),
  fechamento_versao_id uuid references fechamento_versoes(id),

  declaracao_id uuid references declaracoes(id),
  declaracao_versao_id uuid references declaracao_versoes(id),

  tipo_documento text not null,

  nome_arquivo text not null,
  storage_path text not null,

  mime_type text,
  tamanho_bytes bigint,

  enviado_por uuid,

  criado_em timestamptz default now()
);
```

Tipos sugeridos:

```text
DRE
BALANCO
DMPL
DFC
DRA
RECIBO_ECD
RECIBO_ECF
COMPROVANTE
OUTRO
```

---

### 10.12 `execucoes_integracao`

```sql
create table execucoes_integracao (
  id uuid primary key default gen_random_uuid(),

  origem text not null,
  workflow text,

  codigo_empresa integer,
  ano integer,
  periodo_codigo text,

  data_inicio date,
  data_fim date,
  data_fim_exclusiva date,

  status text not null,

  payload jsonb,
  resultado jsonb,
  mensagem_erro text,

  iniciado_em timestamptz default now(),
  finalizado_em timestamptz
);
```

---

## 11. Índices recomendados

```sql
create index idx_empresas_codigo on empresas(codigo_empresa);
create index idx_empresas_cnpj on empresas(cnpj);

create index idx_fechamentos_empresa_ano on fechamentos(empresa_id, ano);
create index idx_fechamentos_periodo on fechamentos(periodo_codigo);
create index idx_fechamentos_status on fechamentos(status_fechamento);

create index idx_fechamento_versoes_fechamento on fechamento_versoes(fechamento_id);

create index idx_declaracoes_empresa_ano on declaracoes(empresa_id, ano);
create index idx_declaracoes_tipo on declaracoes(tipo_declaracao);
create index idx_declaracoes_status on declaracoes(status_atual);

create index idx_historico_fechamento on historico_status(fechamento_id);
create index idx_historico_declaracao on historico_status(declaracao_id);

create index idx_anexos_fechamento on anexos(fechamento_id);
create index idx_anexos_declaracao on anexos(declaracao_id);

create index idx_execucoes_empresa_ano on execucoes_integracao(codigo_empresa, ano);
create index idx_execucoes_periodo on execucoes_integracao(periodo_codigo);
```

---

## 12. Ajuste no select

### 12.1 Parâmetros finais esperados

A CTE `parametros` deve evoluir para algo como:

```sql
with parametros as (
    select
        :empresas_param::text as empresas_param,
        :codigoplano::int as codigoplano,
        :ano::int as ano,
        :periodo_codigo::text as periodo_codigo,
        :data_inicio::date as data_ini,
        :data_fim_exclusiva::date as data_fim
)
```

### 12.2 CTE de período

Em vez de gerar todos os anos automaticamente, o período deve vir parametrizado:

```sql
periodos as (
    select
        p.ano,
        p.periodo_codigo,
        p.data_ini,
        p.data_fim
    from parametros p
)
```

### 12.3 Regras de data

Para DRE:

```sql
l.datalctoctb >= b.data_ini
and l.datalctoctb < b.data_fim
```

Para saldo patrimonial, Balanço, DMPL e DFC, a regra recomendada inicialmente é saldo acumulado até o fim do período:

```sql
s.datasaldo < b.data_fim
```

Essa regra deve ser confirmada com a contabilidade, porque pode haver diferença entre:

```text
saldo acumulado até o fim do período
versus
movimento apenas dentro do período
```

---

## 13. Fluxos n8n

### 13.1 Empresa anual

```text
Webhook gClick ANUAL
↓
Valida payload
↓
Registra execução
↓
Executa select ANUAL
↓
Cria/atualiza fechamento ANUAL
↓
Cria versão do fechamento
↓
Cria/atualiza declaração ECD
↓
Cria/atualiza declaração ECF
↓
Status declaração: Em análise
↓
Salva PDFs e logs
```

---

### 13.2 Empresa trimestral — T1, T2 ou T3

```text
Webhook gClick T1/T2/T3
↓
Valida payload
↓
Registra execução
↓
Executa select do trimestre
↓
Cria/atualiza fechamento do trimestre
↓
Cria versão do fechamento
↓
Não altera ECD/ECF
↓
Salva PDFs e logs
```

---

### 13.3 Empresa trimestral — T4

```text
Webhook gClick T4
↓
Valida payload
↓
Registra execução
↓
Executa select T4
↓
Cria/atualiza fechamento T4
↓
Pode atualizar declaração para "Aguardando fechamento anual"
↓
Salva PDFs e logs
```

---

### 13.4 Empresa trimestral — Anual

```text
Webhook gClick ANUAL
↓
Valida payload
↓
Registra execução
↓
Executa select ANUAL
↓
Cria/atualiza fechamento ANUAL
↓
Cria versão do fechamento
↓
Cria/atualiza declaração ECD
↓
Cria/atualiza declaração ECF
↓
Status declaração: Em análise
↓
Salva PDFs e logs
```

---

## 14. Regras de bloqueio

### 14.1 Fechamento concluído

Quando um fechamento estiver concluído:

```text
não sobrescrever versão entregue/concluída
nova alteração deve criar RET1, RET2 etc.
```

### 14.2 Declaração entregue

Quando ECD ou ECF estiver como entregue:

```text
analista não pode alterar dados principais
gestor pode liberar retificação
retificação cria nova versão
recibo anterior permanece preservado
```

---

## 15. Roadmap

### Fase 1 — MVP

```text
Supabase com tabelas principais
Login
Carteira de empresas
Cadastro/importação de empresas
Periodicidade anual/trimestral
Dashboard de fechamentos
Dashboard de declarações
Webhook n8n
Select parametrizado
PDFs por demonstrativo
Status ECD/ECF
Observações
Logs básicos
```

---

### Fase 2 — Auditoria e histórico avançado

```text
Retificações controladas
Bloqueio após entrega
Histórico detalhado de status
Tela comparativa Original x RET1
Logs técnicos completos
```

---

### Fase 3 — Gestão

```text
Indicadores por responsável
Indicadores por carteira
SLA por obrigação
Alertas de pendência
Exportação Excel/PDF
Resumo por status
```

---

### Fase 4 — Validações automáticas

```text
Comparação entre trimestral e anual
Alerta se anual divergir dos períodos
Comparação banco x PDF
Checklist obrigatório antes de entrega
Validação de ausência de PDF obrigatório
```

---

## 16. Critérios de sucesso

O projeto será considerado bem-sucedido quando:

```text
o relatório manual for substituído pelo painel
cada empresa/ano tiver seus fechamentos controlados
empresas trimestrais forem tratadas corretamente
ECD e ECF tiverem status anuais separados
o 4º trimestre puder apoiar o controle da entrega
PDFs estiverem vinculados ao período correto
for possível saber quem zerou, analisou e entregou
retificações preservarem histórico anterior
usuários visualizarem apenas empresas permitidas
gestores tiverem visão consolidada de pendências
erros de integração forem rastreáveis e reprocessáveis
```

---

## 17. Resumo da decisão final

A estrutura consolidada deve ser:

```text
Empresa
  ↓
Ano
  ↓
Periodicidade: Anual ou Trimestral
  ↓
Fechamentos
  ├── 1º Trim
  ├── 2º Trim
  ├── 3º Trim
  ├── 4º Trim
  └── Anual
  ↓
Versões do fechamento
  ├── Original
  ├── RET1
  └── RET2
  ↓
Declarações anuais
  ├── ECD
  └── ECF
  ↓
Versões da declaração
  ├── Original
  ├── RET1
  └── RET2
```

Essa modelagem deixa o sistema preparado para empresas anuais e trimestrais, sem misturar o controle contábil dos fechamentos com o controle anual das declarações.

---

## 18. Próximos passos sugeridos

1. Validar com a contabilidade as regras de cálculo para DRE, Balanço, DMPL e DFC por trimestre.
2. Transformar o select atual em versão parametrizada por período.
3. Criar o schema inicial no Supabase.
4. Implementar RLS por carteira de empresas.
5. Criar o primeiro fluxo n8n com webhook de zeramento.
6. Criar MVP do dashboard de fechamentos.
7. Criar MVP do dashboard de declarações.
8. Testar com um grupo pequeno de empresas anuais e trimestrais.
