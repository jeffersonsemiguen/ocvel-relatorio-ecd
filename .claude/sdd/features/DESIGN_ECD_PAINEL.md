# DESIGN: Painel de Controle ECD/ECF e Fechamentos Contábeis

> Especificação técnica completa do MVP do `ocvel-relatorio-ecd` — frontend Vite/React/Tailwind v4/shadcn-ui + Supabase (Postgres + Storage + Auth + RLS) + n8n (orquestração de webhook gClick e select parametrizado). Este documento é o contrato de execução para o agente Build.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | ECD_PAINEL |
| **Codename** | `ocvel-relatorio-ecd` |
| **Date** | 2026-05-06 |
| **Author** | design-agent |
| **DEFINE** | [DEFINE_ECD_PAINEL.md](./DEFINE_ECD_PAINEL.md) |
| **PRD base** | `PRD_SPEC_ECD_ECF_Fechamentos_v1_2.md` (v1.2) |
| **Status** | Ready for Build |
| **Stack** | Vite + React 18 + TS + Tailwind v4 + shadcn/ui + Supabase + n8n |

---

## 1. Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                       OCVEL — PAINEL ECD/ECF (MVP)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐  zeramento     ┌──────────┐    ┌──────────────────────────┐   │
│   │  gClick  │ ───POST────►   │   n8n    │───►│ banco contábil (read)    │   │
│   │   ERP    │                │ workflow │    │ select parametrizado     │   │
│   └──────────┘                │ webhook  │    └──────────┬───────────────┘   │
│                               └────┬─────┘               │                   │
│                                    │ pdfs(base64)        │ rows              │
│                                    ▼                     ▼                   │
│                          ┌────────────────────────────────────────┐          │
│                          │           Supabase Backend              │         │
│                          │ ┌────────────┐ ┌──────────┐ ┌────────┐ │         │
│                          │ │ Postgres   │ │ Storage  │ │  Auth  │ │         │
│                          │ │ (12 tabs)  │ │ (anexos) │ │ (JWT)  │ │         │
│                          │ │ + RLS      │ │ + RLS    │ │        │ │         │
│                          │ └─────┬──────┘ └────┬─────┘ └───┬────┘ │         │
│                          │       │             │           │      │         │
│                          │       └──── Edge Functions ─────┘      │         │
│                          │       (fallback manual / signed urls)  │         │
│                          └────────────────┬───────────────────────┘         │
│                                           │ HTTPS + JWT                      │
│                                           ▼                                  │
│                          ┌────────────────────────────────────────┐          │
│                          │     Frontend Vite/React (SPA)           │         │
│                          │  TanStack Query • shadcn/ui • Tailwind  │         │
│                          │  Pages: Login • Dashboard Fechamentos • │         │
│                          │         Dashboard Declarações • Detalhe │         │
│                          │         Carteira • Histórico            │         │
│                          └────────────────────────────────────────┘          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Data flow (happy path AT-001):**

```text
1. gClick zeramento → 2. n8n /webhook/zeramento (idempotência por
   (codigo_empresa, ano, periodo_codigo)) → 3. n8n executa select
   parametrizado no banco contábil → 4. n8n insere fechamento +
   fechamento_versao (numero=0) via Supabase REST → 5. n8n upload
   PDFs no bucket anexos/ → 6. n8n grava anexos + execucoes_integracao
   → 7. Frontend consulta via TanStack Query → 8. Analista vê linha
   no Dashboard Fechamentos com badges e PDFs
```

---

## 2. Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Frontend SPA** | Painel web com Dashboards, Detalhe, Carteira, Histórico | Vite 5 + React 18 + TypeScript 5 + React Router 6 |
| **UI Layer** | Componentes shadcn/ui com tokens OCVEL | Tailwind v4 + shadcn + lucide-react + sonner |
| **Data Layer** | Cache, mutations, optimistic updates | TanStack Query v5 + supabase-js v2 |
| **Auth** | Login email/senha + magic link, JWT propagado para RLS | Supabase Auth (`@supabase/supabase-js`) |
| **Database** | 12 tabelas PT-BR + índices + RLS + triggers | Postgres (Supabase) |
| **Storage** | Bucket privado `anexos` para PDFs (DRE/Balanço/DMPL/DFC/DRA + recibos) | Supabase Storage + RLS |
| **Edge Functions** | `manual-fechamento` (fallback), `signed-url` (URLs temporárias) | Supabase Edge Functions (Deno/TS) |
| **Webhook Integrator** | Recebe zeramento gClick, executa select, persiste no Supabase | n8n cloud workflow |
| **Logging/Audit** | `historico_status`, `observacoes`, `execucoes_integracao` | Postgres triggers + RLS |

---

## 3. Key Decisions (Inline ADRs)

### Decision 1: RLS no Postgres como camada primária de autorização

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** Frontend (qualquer SPA) é compromissível. Permissões por carteira de analista precisam ser garantidas mesmo se um usuário fizer requests diretos à API REST do Supabase.

**Choice:** Row Level Security em **todas** as tabelas, com policies por perfil (`analista`, `consultoria`, `gestor`, `admin`) lendo `auth.uid()` e cruzando com `carteira_empresas` e `usuarios_perfis`.

**Rationale:**
- SC-04 exige validação direto no Postgres com JWT do analista.
- Supabase já expõe API REST → defesa em profundidade obrigatória.
- Policies declarativas evitam reescrita de regras no frontend.

**Alternatives Rejected:**
1. Apenas validação no front com filtros (`where empresa_id in (...)`). Rejeitado: trivialmente burlável via cliente HTTP customizado.
2. Backend Node/Python intermediário com auth manual. Rejeitado: aumenta superfície operacional, contraria escolha do PRD por BaaS.

**Consequences:**
- Toda nova tabela exige policies desde o dia 1 (parte do `Definition of Done`).
- Performance crítica: índices em `(empresa_id)`, `(usuario_id, ano)` em `carteira_empresas`.
- Testes RLS são obrigatórios (Vitest + supabase local).

---

### Decision 2: Status como `text` + `CHECK constraint` (não FK para tabela `status`)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** Estados de fechamento e declaração são fixos e raramente mudam (`zerado`, `em_analise`, `aprovado`, `reprovado`, `entregue`, `retificacao_pendente`).

**Choice:** Coluna `status text NOT NULL CHECK (status IN ('zerado', ...))`. Lista canônica em migration; alteração exige migration nova.

**Rationale:**
- Simplifica joins (zero FK em hot path do dashboard).
- Mensagens de erro PG explícitas em violação.
- Lista pequena (≤ 10 valores) — overkill ter tabela.

**Alternatives Rejected:**
1. Enum Postgres. Rejeitado: alterar enum exige `ALTER TYPE` que trava DDL e não suporta DROP de valor.
2. Tabela `status_fechamento` + FK. Rejeitado: complexidade desproporcional, exige join em todo SELECT.

**Consequences:**
- Adicionar status novo = nova migration `ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT`.
- Frontend mantém mapa `status → label PT-BR` em `src/constants/status.ts`.

---

### Decision 3: Versionamento via tabelas separadas `*_versoes` com `bloqueada boolean`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** SPED permite Original (numero=0), RET1 (1), RET2 (2)... Cada versão tem PDFs e valores próprios. Original entregue é imutável (PRD §RNF). Trigger é necessário para impedir UPDATE em linhas com `bloqueada=true`.

**Choice:**
- Tabela `fechamentos` mantém **estado corrente**.
- Tabela `fechamento_versoes` mantém **histórico imutável** com `(fechamento_id, numero_versao, bloqueada)`.
- Trigger `trg_versao_imutavel` rejeita UPDATE em colunas de valor quando `bloqueada=true`.
- Mesmo padrão para `declaracao_versoes`.

**Rationale:**
- AT-005 / AT-006 explícitos: bloqueada nunca muda; retificação cria novo registro.
- Separar histórico do estado corrente acelera dashboards (sem `DISTINCT ON`).
- Trigger garante imutabilidade mesmo se RLS for mal configurada.

**Alternatives Rejected:**
1. Versionamento via JSON column. Rejeitado: inviabiliza queries de auditoria (`WHERE numero_versao = 1`).
2. Tabela única com flag `corrente`. Rejeitado: race conditions em troca de versão corrente.

**Consequences:**
- Dashboard sempre lê de `fechamentos` (rápido).
- Detalhe da retificação faz join com `fechamento_versoes`.
- Migration aplica trigger em ambas tabelas de versão.

---

### Decision 4: n8n como único orquestrador do webhook gClick

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** Pipeline gClick → select contábil → Supabase exige: idempotência, retry, branching de erro, log estruturado. Construir isso em Edge Function exigiria muito código.

**Choice:** n8n cloud expõe `/webhook/zeramento`. Workflow nodes: Webhook → Validate → CheckIdempotency (Supabase) → Postgres (banco contábil select) → SupabaseInsert(fechamento+versao) → SupabaseStorageUpload (loop PDFs) → SupabaseInsert(anexos) → SupabaseInsert(execucoes_integracao). Branch de erro grava status=erro.

**Rationale:**
- Visual workflow facilita manutenção pelo time não-dev.
- Retries e error branching nativos.
- MCP n8n permite criar/atualizar workflow programaticamente.

**Alternatives Rejected:**
1. Edge Function única. Rejeitado: lógica de retry + idempotência manual + falta de visibilidade.
2. Cron diário no banco contábil. Rejeitado: latência de 24h inaceitável (SC-02 exige ≤ 24h).

**Consequences:**
- Workflow é versionado como JSON em `n8n/workflows/zeramento_v1.json`.
- gClick aponta para URL do n8n cloud (variável por ambiente).
- Edge Function `manual-fechamento` reutiliza o **mesmo** path de criação (Decision 7) para garantir AT-003.

---

### Decision 5: Supabase Storage como único provider de PDFs

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** PDFs (DRE/Balanço/DMPL/DFC/DRA + recibos ECD/ECF) precisam ser acessíveis com RLS de carteira (AT-012). Out-of-scope inclui CDN externa.

**Choice:** Bucket privado `anexos` com RLS policies espelhando carteira. URLs servidas via signed URL (TTL 1h). `storage_path` salvo em `anexos.storage_path` no padrão `empresa_{id}/ano_{ano}/fechamento_{id}/v{numero}/{tipo}.pdf`.

**Rationale:**
- A-011: PDFs ≤ 50MB cabem no plano standard.
- RLS de bucket Supabase reaproveita `auth.uid()` e join com `carteira_empresas`.
- Path estruturado facilita cleanup e auditoria.

**Alternatives Rejected:**
1. GCS / S3. Rejeitado: exige IAM separada e SSO; adiciona managed service não previsto.
2. URLs públicas. Rejeitado: viola AT-012 (acesso sem RLS).
3. Bucket por tipo de documento. Rejeitado: 7 buckets multiplicam policies — Q-6 resolvida com 1 bucket.

**Consequences:**
- Tipo de documento é coluna em `anexos` (`tipo_documento text CHECK IN (...)`), não bucket.
- Edge Function `signed-url` gera URL temporária validando carteira.

---

### Decision 6: Tabelas e colunas em PT-BR; código TypeScript em EN

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted (confirmado A-005) |
| **Date** | 2026-05-06 |

**Context:** Time contábil OCVEL precisa ler SQL ad-hoc em produção (queries de auditoria). DDL em EN gera fricção. Mas código TS em EN é padrão da indústria e da KB `ocvel-frontend`.

**Choice:**
- DDL: `empresas`, `fechamentos`, `declaracoes`, `historico_status` (PT-BR).
- TS types: `Empresa`, `Fechamento`, `Declaracao`, `StatusHistory` em `src/types/database.ts` (EN para nomes de tipos), porém **propriedades** mantêm nome do banco para evitar mapeamento manual (`fechamento.razao_social`).
- UI: 100% PT-BR; código: EN; comentários SQL: PT-BR.

**Rationale:**
- Eliminar camada de mapper (snake_case ↔ camelCase) para BaaS direto.
- Supabase TypeScript codegen (`supabase gen types`) já produz tipos com nomes do banco.

**Alternatives Rejected:**
1. Tudo EN. Rejeitado: viola constraint do PRD e A-005 confirmada.
2. Tudo PT-BR (incluindo TS). Rejeitado: contraria KB `ocvel-frontend` e padrão React.

**Consequences:**
- Use `pnpm supabase:types` para regenerar `src/types/database.ts` após cada migration.
- Hooks ficam levemente híbridos: `useFechamentos()` retorna `Fechamento[]` com props PT-BR.

---

### Decision 7: Edge Function `manual-fechamento` reusa contrato do webhook

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted (resolve Q-7) |
| **Date** | 2026-05-06 |

**Context:** AT-003 exige fallback manual quando n8n indisponível. Q-7 questiona se fallback usa mesmo path do webhook.

**Choice:** Edge Function Deno `supabase/functions/manual-fechamento/index.ts` aceita o mesmo payload do webhook (`{codigo_empresa, ano, periodo_codigo, arquivos_pdf[]}`) e executa as mesmas etapas (idempotência, insert, upload, log). Diferença: marca `execucoes_integracao.origem = 'manual'`.

**Rationale:**
- Garante invariante: 1 path de criação → 1 set de testes.
- Frontend pode upload PDFs e chamar a função; analista loga origem.

**Alternatives Rejected:**
1. Insert direto via supabase-js no front. Rejeitado: lógica de idempotência fica replicada no front.
2. Path completamente novo. Rejeitado: drift entre fluxos (manual permite o que webhook não permite).

**Consequences:**
- Edge Function compartilha módulo `_shared/fechamento-creator.ts` que o webhook n8n também invoca via HTTP (n8n chama Edge Function ao invés de REST).
- Decisão revisada na Sprint 2 se latência for problema.

---

### Decision 8: Soft-delete via `ativo boolean` (zero DELETE físico)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** AT-014 exige preservação de observações para auditoria mesmo quando "excluídas".

**Choice:** Toda tabela mutável (especialmente `observacoes`, `anexos`) tem `ativo boolean NOT NULL DEFAULT true`. RLS retorna apenas `ativo=true` por padrão. "Exclusão" = `UPDATE ... SET ativo=false`.

**Rationale:** Trivial, padrão da indústria, alinha com A-005 e auditoria mandatória.

**Consequences:**
- Frontend filtra `ativo=true` por default.
- Admin pode habilitar view "incluir excluídas" via filtro em queries específicas.

---

### Decision 9: Periodicidades restritas a `T1, T2, T3, T4, ANUAL` (resolve Q-3)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-05-06 |

**Context:** PRD/brainstorm não mencionam MENSAL.

**Choice:** Constraint `CHECK (periodo IN ('T1','T2','T3','T4','ANUAL'))`. Tabela `empresa_periodicidade(empresa_id, ano, periodicidade text CHECK IN ('TRIMESTRAL','ANUAL'))` define se a empresa gera 4 trimestres ou 1 anual em cada ano.

**Consequences:** AT-008 implementado: trigger ou job seed cria N fechamentos baseado em `periodicidade` do par `(empresa, ano)`.

---

### Decision 10: Visibilidade de Gestor / Consultoria (resolve Q-1, Q-2)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted (proposto, validar com usuário) |
| **Date** | 2026-05-06 |

**Choice:**
- **Gestor**: vê **todas** as carteiras (sem filtro por carteira). Necessário para consolidação.
- **Consultoria**: vê empresas explicitamente atribuídas em `carteira_empresas` com `papel='consultoria'`. Mesmo modelo que analista.
- **Admin**: bypass total.

**Rationale:** Modelo simétrico, facilita policies. Pode ser refinado em Sprint 2 se gestor precisar escopo limitado.

---

## 4. Database Schema (Supabase Postgres)

### 4.1 Diagrama lógico

```text
auth.users (Supabase) ──┐
                        │
                        ▼
                  usuarios_perfis (perfil: analista/consultoria/gestor/admin)
                        │
                        ▼
                  carteira_empresas ──────► empresas ◄─── empresa_periodicidade
                                              │   │
                                              │   ▼
                                              │  fechamentos ──► fechamento_versoes
                                              │       │
                                              │       └──► historico_status
                                              │       └──► observacoes
                                              │       └──► anexos
                                              │
                                              └──► declaracoes ──► declaracao_versoes
                                                       │
                                                       └──► historico_status
                                                       └──► observacoes
                                                       └──► anexos

execucoes_integracao  (log append-only de webhooks)
```

### 4.2 DDL completo (canônico — gera 12 tabelas)

> Migration files no manifesto §6 abaixo. Resumo das tabelas:

| Tabela | PK | Colunas-chave | Notas |
|--------|----|----|---|
| `empresas` | `id uuid` | `codigo_empresa text UNIQUE`, `cnpj text UNIQUE`, `razao_social text`, `regime_tributario text` | Seed BASSO 2025 |
| `empresa_periodicidade` | `(empresa_id, ano)` | `periodicidade text CHECK ('TRIMESTRAL','ANUAL')` | Define quantos fechamentos criar |
| `usuarios_perfis` | `usuario_id uuid (FK auth.users)` | `perfil text CHECK ('analista','consultoria','gestor','admin')`, `nome_completo text` | 1:1 com auth.users |
| `carteira_empresas` | `(usuario_id, empresa_id)` | `papel text CHECK ('analista','consultoria')`, `ativo bool` | Drives RLS |
| `fechamentos` | `id uuid` | `empresa_id`, `ano int`, `periodo text`, `status text`, `origem text` | UNIQUE(empresa_id, ano, periodo) |
| `fechamento_versoes` | `id uuid` | `fechamento_id`, `numero_versao int`, `bloqueada bool`, `valores jsonb`, `criado_em` | UNIQUE(fechamento_id, numero_versao) |
| `declaracoes` | `id uuid` | `empresa_id`, `ano int`, `tipo_declaracao text CHECK ('ECD','ECF')`, `status text` | UNIQUE(empresa_id, ano, tipo_declaracao) |
| `declaracao_versoes` | `id uuid` | `declaracao_id`, `numero_versao int`, `bloqueada bool`, `hash_anterior text` | hash_anterior preservado para retificação SPED |
| `historico_status` | `id uuid` | `entidade_tipo text`, `entidade_id uuid`, `status_anterior`, `status_novo`, `usuario_id`, `criado_em` | Append-only |
| `observacoes` | `id uuid` | `entidade_tipo`, `entidade_id`, `conteudo text`, `usuario_id`, `ativo bool` | Soft-delete |
| `anexos` | `id uuid` | `entidade_tipo`, `entidade_id`, `tipo_documento text`, `storage_path text`, `tamanho_bytes int`, `ativo bool` | tipo: DRE/BALANCO/DMPL/DFC/DRA/RECIBO_ECD/RECIBO_ECF |
| `execucoes_integracao` | `id uuid` | `tipo text`, `chave_idempotencia text`, `status text`, `payload_recebido jsonb`, `resultado jsonb`, `origem text` | log de webhook + manual |

### 4.3 Status canônicos (CHECK constraints)

```sql
-- Fechamentos
CHECK (status IN ('zerado','em_analise','aprovado','reprovado','entregue','retificacao_pendente'))

-- Declaracoes (ECD / ECF)
CHECK (status IN ('pendente','zerado','em_analise','aprovado','transmitido','retificacao_pendente','retificada'))

-- execucoes_integracao
CHECK (status IN ('sucesso','erro','duplicado','timeout','em_andamento'))
```

### 4.4 Máquina de estados (resolve Q-4)

```text
Fechamento:
  zerado ──► em_analise ──► aprovado ──► entregue
     │           │              │            │
     │           ▼              ▼            ▼
     └─► reprovado ◄────────────┘   retificacao_pendente
                                            │
                                            ▼
                                         (cria nova versão; volta a 'em_analise')

Declaracao (ECD/ECF):
  pendente ──► zerado ──► em_analise ──► aprovado ──► transmitido
                                                          │
                                                          ▼
                                                   retificacao_pendente ──► retificada
```

Validação: trigger `trg_validar_transicao_status` em `historico_status` (BEFORE INSERT) verifica par `(status_anterior, status_novo)` em tabela `_transicoes_validas`. Admin bypass via `SET LOCAL app.bypass_status = 'on'`.

### 4.5 Índices críticos

```sql
CREATE INDEX idx_fechamentos_empresa_ano ON fechamentos(empresa_id, ano);
CREATE INDEX idx_fechamentos_status ON fechamentos(status);
CREATE INDEX idx_carteira_usuario ON carteira_empresas(usuario_id) WHERE ativo = true;
CREATE INDEX idx_carteira_empresa ON carteira_empresas(empresa_id) WHERE ativo = true;
CREATE INDEX idx_versoes_fechamento ON fechamento_versoes(fechamento_id, numero_versao);
CREATE INDEX idx_anexos_entidade ON anexos(entidade_tipo, entidade_id) WHERE ativo = true;
CREATE INDEX idx_historico_entidade ON historico_status(entidade_tipo, entidade_id, criado_em DESC);
CREATE INDEX idx_execucoes_chave ON execucoes_integracao(chave_idempotencia);
```

### 4.6 RLS Policies — matriz

| Tabela | analista | consultoria | gestor | admin |
|--------|----------|-------------|--------|-------|
| `empresas` | SELECT via carteira | SELECT via carteira (papel=consultoria) | SELECT all | ALL |
| `fechamentos` | SELECT/INSERT/UPDATE via carteira | SELECT/UPDATE (status≠entregue) | SELECT/UPDATE all | ALL |
| `fechamento_versoes` | SELECT via carteira; INSERT v=0; UPDATE only if `bloqueada=false` | idem | SELECT/UPDATE all | ALL |
| `declaracoes` | SELECT/UPDATE via carteira | SELECT/UPDATE | SELECT/UPDATE all | ALL |
| `carteira_empresas` | SELECT only own | SELECT only own | SELECT all | ALL |
| `historico_status` | INSERT only (append) | INSERT only | SELECT/INSERT all | ALL |
| `observacoes` | SELECT via carteira; INSERT/UPDATE (ativo) own | idem | SELECT/INSERT/UPDATE all | ALL |
| `anexos` | SELECT via carteira; INSERT via carteira | idem | SELECT all | ALL |
| `execucoes_integracao` | — | — | SELECT all | ALL (insert via service_role) |

**Helper function:**
```sql
CREATE OR REPLACE FUNCTION usuario_tem_empresa(p_empresa_id uuid)
RETURNS bool LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM carteira_empresas
    WHERE usuario_id = auth.uid()
      AND empresa_id = p_empresa_id
      AND ativo = true
  ) OR EXISTS (
    SELECT 1 FROM usuarios_perfis
    WHERE usuario_id = auth.uid()
      AND perfil IN ('gestor','admin')
  );
$$;
```

---

## 5. Frontend Architecture

### 5.1 Project structure

```text
ocvel-relatorio-ecd/
├── src/
│   ├── main.tsx                          # React root + BrowserRouter + QueryClientProvider
│   ├── App.tsx                           # Routes
│   ├── index.css                         # Tailwind v4 + tokens OCVEL
│   ├── env.d.ts                          # Vite env types
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase client (singleton)
│   │   ├── utils.ts                      # cn() helper
│   │   ├── query-client.ts               # TanStack Query config
│   │   └── format.ts                     # CNPJ, currency, date formatters PT-BR
│   ├── types/
│   │   ├── database.ts                   # gerado: pnpm supabase:types
│   │   └── domain.ts                     # tipos derivados (FechamentoComVersoes etc.)
│   ├── constants/
│   │   ├── status.ts                     # mapas status→label PT-BR
│   │   └── periodos.ts                   # T1..T4, ANUAL labels
│   ├── contexts/
│   │   └── AuthContext.tsx               # JWT, perfil, sessão
│   ├── hooks/
│   │   ├── useTheme.ts                   # dark mode (KB ocvel-frontend)
│   │   ├── useAuth.ts                    # session + perfil
│   │   ├── useEmpresas.ts                # carteira do usuário
│   │   ├── useFechamentos.ts             # lista paginada por ano
│   │   ├── useFechamento.ts              # detalhe + versões
│   │   ├── useDeclaracoes.ts
│   │   ├── useDeclaracao.ts
│   │   ├── useObservacoes.ts
│   │   ├── useAnexos.ts
│   │   ├── useHistorico.ts
│   │   ├── useUpdateStatus.ts            # mutation
│   │   ├── useCriarObservacao.ts         # mutation
│   │   ├── useUploadAnexo.ts             # mutation
│   │   └── useSignedUrl.ts               # invoca Edge Function
│   ├── components/
│   │   ├── ui/                           # shadcn primitives (button, card, table, dialog, badge, sonner, ...)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # sidebar + topbar
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RequireAuth.tsx           # route guard
│   │   ├── fechamento/
│   │   │   ├── FechamentosTable.tsx
│   │   │   ├── FechamentoStatusBadge.tsx
│   │   │   ├── FechamentoDetailCard.tsx
│   │   │   ├── FechamentoVersoesList.tsx
│   │   │   ├── CriarFechamentoManualDialog.tsx
│   │   │   └── MudarStatusDialog.tsx
│   │   ├── declaracao/
│   │   │   ├── DeclaracoesTable.tsx
│   │   │   ├── DeclaracaoStatusBadge.tsx
│   │   │   └── DeclaracaoDetailCard.tsx
│   │   ├── anexo/
│   │   │   ├── AnexosList.tsx
│   │   │   ├── UploadAnexoDialog.tsx
│   │   │   └── AnexoDownloadButton.tsx   # gera signed URL
│   │   ├── observacao/
│   │   │   ├── ObservacoesList.tsx
│   │   │   └── ObservacaoForm.tsx
│   │   ├── historico/
│   │   │   └── HistoricoTimeline.tsx
│   │   ├── carteira/
│   │   │   └── CarteiraTable.tsx
│   │   └── shared/
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSkeleton.tsx
│   │       └── ErrorState.tsx
│   └── pages/
│       ├── LoginPage.tsx
│       ├── DashboardFechamentosPage.tsx
│       ├── DashboardDeclaracoesPage.tsx
│       ├── FechamentoDetailPage.tsx       # /fechamentos/:id
│       ├── DeclaracaoDetailPage.tsx       # /declaracoes/:id
│       ├── CarteiraPage.tsx
│       └── NotFoundPage.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 20260506000001_extensions.sql
│   │   ├── 20260506000002_empresas.sql
│   │   ├── 20260506000003_usuarios_perfis.sql
│   │   ├── 20260506000004_carteira_empresas.sql
│   │   ├── 20260506000005_fechamentos.sql
│   │   ├── 20260506000006_declaracoes.sql
│   │   ├── 20260506000007_anexos.sql
│   │   ├── 20260506000008_observacoes.sql
│   │   ├── 20260506000009_historico_status.sql
│   │   ├── 20260506000010_execucoes_integracao.sql
│   │   ├── 20260506000011_helper_functions.sql
│   │   ├── 20260506000012_rls_policies.sql
│   │   ├── 20260506000013_triggers_imutabilidade.sql
│   │   ├── 20260506000014_storage_bucket_anexos.sql
│   │   └── 20260506000015_seed_basso_2025.sql
│   └── functions/
│       ├── _shared/
│       │   ├── fechamento-creator.ts     # módulo compartilhado (Decision 7)
│       │   ├── idempotency.ts
│       │   └── supabase-admin.ts
│       ├── manual-fechamento/
│       │   └── index.ts
│       └── signed-url/
│           └── index.ts
├── n8n/
│   └── workflows/
│       └── zeramento_v1.json             # exportado via MCP
├── tests/
│   ├── unit/
│   │   ├── format.test.ts
│   │   ├── status.test.ts
│   │   └── hooks/
│   │       └── useFechamentos.test.ts
│   └── rls/
│       ├── carteira.spec.sql             # supabase test SQL
│       ├── versao_imutavel.spec.sql
│       └── transicao_status.spec.sql
├── public/
│   └── favicon.svg
├── .env.example
├── .gitignore
├── components.json                       # shadcn config
├── index.html                            # com inline theme script (KB dark-mode)
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

### 5.2 Routing

| Path | Page | Guard | Notas |
|------|------|-------|-------|
| `/login` | `LoginPage` | public | email/senha + magic link |
| `/` | redirect → `/fechamentos` | auth | |
| `/fechamentos` | `DashboardFechamentosPage` | auth | filtros ano + período + status |
| `/fechamentos/:id` | `FechamentoDetailPage` | auth + carteira | versões, anexos, observações, histórico |
| `/declaracoes` | `DashboardDeclaracoesPage` | auth | ECD/ECF por ano |
| `/declaracoes/:id` | `DeclaracaoDetailPage` | auth + carteira | |
| `/carteira` | `CarteiraPage` | auth | minha carteira (read-only para analista; CRUD admin) |
| `*` | `NotFoundPage` | public | |

### 5.3 UI states (por tela)

| Estado | Componente | Trigger |
|--------|------------|---------|
| **Loading** | `LoadingSkeleton` | `useQuery.isLoading` |
| **Empty (sem carteira)** | `EmptyState` mensagem "Sem empresas na sua carteira" | `data.length === 0` (AT-013) |
| **Error** | `ErrorState` + retry button | `useQuery.isError` |
| **Populated** | tabela/cards | dados carregados |
| **Mutating** | toast Sonner + skeleton row | `useMutation.isPending` |
| **RLS denied** | toast destrutivo "Sem permissão" | erro 42501 (Postgres) |

---

## 6. File Manifest

> Total: **78 arquivos**. Convenção de nomes ASCII; sem espaços em paths. Migrations numeradas YYYYMMDDHHMMSS para ordering.

| # | File | Action | Purpose | Agent | Dependencies |
|---|------|--------|---------|-------|--------------|
| **— Bootstrap —** ||||||
| 1 | `package.json` | Create | Dependências (vite, react, supabase, tanstack-query, shadcn deps) | (general) | None |
| 2 | `pnpm-lock.yaml` | Create | Lock após `pnpm install` | (general) | 1 |
| 3 | `tsconfig.json` | Create | TS strict + paths `@/*` | (general) | None |
| 4 | `tsconfig.node.json` | Create | TS para vite.config.ts | (general) | None |
| 5 | `vite.config.ts` | Create | React + tailwindcss vite plugin + alias `@` | (general) | 3 |
| 6 | `vitest.config.ts` | Create | Vitest + jsdom + @testing-library | (general) | 5 |
| 7 | `postcss.config.js` | Create | Vazio (Tailwind v4 não exige) ou `{}` | (general) | None |
| 8 | `index.html` | Create | Root + inline theme flicker-prevention script (KB dark-mode) | (general) | None |
| 9 | `.env.example` | Create | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FUNCTIONS_URL` | (general) | None |
| 10 | `.gitignore` | Create | node_modules, .env, dist, supabase/.branches | (general) | None |
| 11 | `components.json` | Create | shadcn config (KB shadcn-setup) | (general) | None |
| 12 | `public/favicon.svg` | Create | OCVEL brand mark | (general) | None |
| **— Estilos / Design System —** ||||||
| 13 | `src/index.css` | Create | `@import "tailwindcss"`, `@custom-variant dark`, todos tokens OCVEL light/dark, `@theme inline`, `@layer base` | (general) | None |
| **— Entry / Routing —** ||||||
| 14 | `src/main.tsx` | Create | createRoot + BrowserRouter + QueryClientProvider + AuthProvider + Sonner Toaster | (general) | 13, 19, 20, 22 |
| 15 | `src/App.tsx` | Create | Routes (todas rotas §5.2) | (general) | pages |
| 16 | `src/env.d.ts` | Create | `interface ImportMetaEnv { VITE_SUPABASE_URL: string; ... }` | (general) | None |
| **— Lib / Infra —** ||||||
| 17 | `src/lib/utils.ts` | Create | `cn()` helper (KB shadcn-setup) | (general) | None |
| 18 | `src/lib/supabase.ts` | Create | `createClient` singleton com session persist | (general) | 16 |
| 19 | `src/lib/query-client.ts` | Create | QueryClient (staleTime 30s, retry 1) | (general) | None |
| 20 | `src/lib/format.ts` | Create | `formatCNPJ`, `formatBRL`, `formatDataPt`, `formatPeriodo` | (general) | None |
| **— Tipos / Constantes —** ||||||
| 21 | `src/types/database.ts` | Create | gerado via `supabase gen types typescript` | (general) | migrations |
| 22 | `src/types/domain.ts` | Create | tipos derivados: `FechamentoComEmpresa`, `FechamentoComVersoes`, `Perfil` | (general) | 21 |
| 23 | `src/constants/status.ts` | Create | mapas `STATUS_FECHAMENTO_LABEL`, `STATUS_DECLARACAO_LABEL`, variant→Badge | (general) | None |
| 24 | `src/constants/periodos.ts` | Create | `PERIODOS = ['T1','T2','T3','T4','ANUAL']` + labels | (general) | None |
| **— Auth Context —** ||||||
| 25 | `src/contexts/AuthContext.tsx` | Create | Provider; expõe `session`, `user`, `perfil`, `signIn`, `signOut`, `signInWithMagicLink` | (general) | 18 |
| 26 | `src/components/auth/RequireAuth.tsx` | Create | Wrapper de rota; redirect /login | (general) | 25 |
| 27 | `src/components/auth/LoginForm.tsx` | Create | shadcn Form com email + senha + botão magic link | (general) | 25, ui-button, ui-input, ui-form |
| **— Hooks (TanStack Query) —** ||||||
| 28 | `src/hooks/useTheme.ts` | Create | dark mode (cópia direta da KB) | (general) | None |
| 29 | `src/hooks/useAuth.ts` | Create | wrapper de AuthContext | (general) | 25 |
| 30 | `src/hooks/useEmpresas.ts` | Create | `useQuery(['empresas'], () => supabase.from('empresas').select('*, carteira_empresas!inner(*)'))` | (general) | 18, 22 |
| 31 | `src/hooks/useFechamentos.ts` | Create | filtro `(ano, periodo?, status?)`; join empresa | (general) | 18, 22 |
| 32 | `src/hooks/useFechamento.ts` | Create | detalhe por id + versões + anexos | (general) | 18 |
| 33 | `src/hooks/useDeclaracoes.ts` | Create | filtro `(ano, tipo?)` | (general) | 18 |
| 34 | `src/hooks/useDeclaracao.ts` | Create | detalhe por id | (general) | 18 |
| 35 | `src/hooks/useObservacoes.ts` | Create | por entidade (`fechamento`/`declaracao`) | (general) | 18 |
| 36 | `src/hooks/useAnexos.ts` | Create | por entidade | (general) | 18 |
| 37 | `src/hooks/useHistorico.ts` | Create | timeline ordenada DESC | (general) | 18 |
| 38 | `src/hooks/useUpdateStatus.ts` | Create | mutation: update + insert historico_status | (general) | 18 |
| 39 | `src/hooks/useCriarObservacao.ts` | Create | mutation INSERT | (general) | 18 |
| 40 | `src/hooks/useUploadAnexo.ts` | Create | upload Storage + INSERT anexos | (general) | 18 |
| 41 | `src/hooks/useSignedUrl.ts` | Create | `supabase.functions.invoke('signed-url', ...)` | (general) | 18 |
| 42 | `src/hooks/useCriarFechamentoManual.ts` | Create | invoke Edge Function `manual-fechamento` | (general) | 18 |
| **— shadcn UI primitives (gerados) —** ||||||
| 43 | `src/components/ui/button.tsx` | Create | `npx shadcn add button` | (general) | 11, 13 |
| 44 | `src/components/ui/card.tsx` | Create | shadcn add card | (general) | idem |
| 45 | `src/components/ui/table.tsx` | Create | shadcn add table | (general) | idem |
| 46 | `src/components/ui/badge.tsx` | Create | shadcn add badge | (general) | idem |
| 47 | `src/components/ui/dialog.tsx` | Create | shadcn add dialog | (general) | idem |
| 48 | `src/components/ui/input.tsx` | Create | shadcn add input | (general) | idem |
| 49 | `src/components/ui/form.tsx` | Create | shadcn add form (react-hook-form + zod) | (general) | idem |
| 50 | `src/components/ui/select.tsx` | Create | shadcn add select | (general) | idem |
| 51 | `src/components/ui/skeleton.tsx` | Create | shadcn add skeleton | (general) | idem |
| 52 | `src/components/ui/sonner.tsx` | Create | shadcn add sonner | (general) | idem |
| 53 | `src/components/ui/dropdown-menu.tsx` | Create | shadcn add dropdown-menu | (general) | idem |
| 54 | `src/components/ui/tabs.tsx` | Create | shadcn add tabs | (general) | idem |
| 55 | `src/components/ui/textarea.tsx` | Create | shadcn add textarea | (general) | idem |
| **— Layout —** ||||||
| 56 | `src/components/layout/AppShell.tsx` | Create | Outlet + Sidebar + TopBar | (general) | 57, 58 |
| 57 | `src/components/layout/Sidebar.tsx` | Create | navegação Fechamentos/Declarações/Carteira | (general) | 43 |
| 58 | `src/components/layout/TopBar.tsx` | Create | usuário, perfil, theme toggle, logout | (general) | 59, 25 |
| 59 | `src/components/layout/ThemeToggle.tsx` | Create | botão Sol/Lua (KB dark-mode) | (general) | 28, 43 |
| **— Fechamento —** ||||||
| 60 | `src/components/fechamento/FechamentoStatusBadge.tsx` | Create | cva variants por status | (general) | 23, 46 |
| 61 | `src/components/fechamento/FechamentosTable.tsx` | Create | tabela com filtros | (general) | 31, 45, 60 |
| 62 | `src/components/fechamento/FechamentoDetailCard.tsx` | Create | card com metadata + ações | (general) | 32, 44, 60 |
| 63 | `src/components/fechamento/FechamentoVersoesList.tsx` | Create | lista versões com bloqueada bool | (general) | 32 |
| 64 | `src/components/fechamento/CriarFechamentoManualDialog.tsx` | Create | form fallback (AT-003) | (general) | 42, 47, 49 |
| 65 | `src/components/fechamento/MudarStatusDialog.tsx` | Create | dialog com select de status válidos | (general) | 38, 47, 50 |
| **— Declaração —** ||||||
| 66 | `src/components/declaracao/DeclaracaoStatusBadge.tsx` | Create | idem fechamento | (general) | 23, 46 |
| 67 | `src/components/declaracao/DeclaracoesTable.tsx` | Create | dois subblocos: ECD e ECF independentes (AT-007) | (general) | 33, 45, 66 |
| 68 | `src/components/declaracao/DeclaracaoDetailCard.tsx` | Create | similar a fechamento | (general) | 34, 44, 66 |
| **— Anexo / Observação / Histórico —** ||||||
| 69 | `src/components/anexo/AnexosList.tsx` | Create | tabela + download via signed url | (general) | 36, 70, 71 |
| 70 | `src/components/anexo/UploadAnexoDialog.tsx` | Create | input file + tipo_documento select | (general) | 40, 47 |
| 71 | `src/components/anexo/AnexoDownloadButton.tsx` | Create | invoca useSignedUrl, abre nova aba | (general) | 41 |
| 72 | `src/components/observacao/ObservacoesList.tsx` | Create | lista com soft-delete | (general) | 35 |
| 73 | `src/components/observacao/ObservacaoForm.tsx` | Create | textarea + submit | (general) | 39, 49, 55 |
| 74 | `src/components/historico/HistoricoTimeline.tsx` | Create | timeline vertical PT-BR | (general) | 37 |
| **— Carteira —** ||||||
| 75 | `src/components/carteira/CarteiraTable.tsx` | Create | empresas da carteira | (general) | 30, 45 |
| **— Shared —** ||||||
| 76 | `src/components/shared/EmptyState.tsx` | Create | ícone + msg + cta opcional | (general) | 43 |
| 77 | `src/components/shared/LoadingSkeleton.tsx` | Create | skeleton genérico | (general) | 51 |
| 78 | `src/components/shared/ErrorState.tsx` | Create | erro + retry button | (general) | 43 |
| **— Pages —** ||||||
| 79 | `src/pages/LoginPage.tsx` | Create | LoginForm + branding OCVEL | (general) | 27 |
| 80 | `src/pages/DashboardFechamentosPage.tsx` | Create | filtros ano/período + FechamentosTable | (general) | 61, 64 |
| 81 | `src/pages/DashboardDeclaracoesPage.tsx` | Create | filtro ano + DeclaracoesTable (ECD+ECF) | (general) | 67 |
| 82 | `src/pages/FechamentoDetailPage.tsx` | Create | tabs: Detalhe / Versões / Anexos / Observações / Histórico | (general) | 62, 63, 69, 72, 74, 54 |
| 83 | `src/pages/DeclaracaoDetailPage.tsx` | Create | mesmas tabs adaptadas | (general) | 68, 69, 72, 74 |
| 84 | `src/pages/CarteiraPage.tsx` | Create | CarteiraTable + empty state | (general) | 75, 76 |
| 85 | `src/pages/NotFoundPage.tsx` | Create | 404 PT-BR | (general) | 43 |
| **— Migrations Supabase —** ||||||
| 86 | `supabase/migrations/20260506000001_extensions.sql` | Create | `create extension if not exists pgcrypto, citext` | (general) | None |
| 87 | `supabase/migrations/20260506000002_empresas.sql` | Create | tabela `empresas` + `empresa_periodicidade` + índices | (general) | 86 |
| 88 | `supabase/migrations/20260506000003_usuarios_perfis.sql` | Create | tabela + trigger ON INSERT auth.users | (general) | 86 |
| 89 | `supabase/migrations/20260506000004_carteira_empresas.sql` | Create | tabela + índices | (general) | 87, 88 |
| 90 | `supabase/migrations/20260506000005_fechamentos.sql` | Create | `fechamentos` + `fechamento_versoes` + UNIQUE + CHECK status | (general) | 87 |
| 91 | `supabase/migrations/20260506000006_declaracoes.sql` | Create | `declaracoes` + `declaracao_versoes` | (general) | 87 |
| 92 | `supabase/migrations/20260506000007_anexos.sql` | Create | tabela + CHECK tipo_documento | (general) | 90, 91 |
| 93 | `supabase/migrations/20260506000008_observacoes.sql` | Create | tabela + ativo + índice parcial | (general) | 90, 91 |
| 94 | `supabase/migrations/20260506000009_historico_status.sql` | Create | tabela + tabela `_transicoes_validas` + seed transições | (general) | 90, 91 |
| 95 | `supabase/migrations/20260506000010_execucoes_integracao.sql` | Create | tabela + chave_idempotencia UNIQUE | (general) | 86 |
| 96 | `supabase/migrations/20260506000011_helper_functions.sql` | Create | `usuario_tem_empresa()`, `auth_perfil()` | (general) | 88, 89 |
| 97 | `supabase/migrations/20260506000012_rls_policies.sql` | Create | RLS ENABLE + todas policies (matriz §4.6) | (general) | 86-96 |
| 98 | `supabase/migrations/20260506000013_triggers_imutabilidade.sql` | Create | trigger versão imutável + trigger validação transição | (general) | 90, 91, 94 |
| 99 | `supabase/migrations/20260506000014_storage_bucket_anexos.sql` | Create | `insert into storage.buckets ('anexos', private)` + policies bucket | (general) | 96 |
| 100 | `supabase/migrations/20260506000015_seed_basso_2025.sql` | Create | seed 1 empresa BASSO + periodicidade 2025=ANUAL (resolve Q-5) | (general) | 87 |
| **— Edge Functions —** ||||||
| 101 | `supabase/functions/_shared/supabase-admin.ts` | Create | client com service_role | (general) | None |
| 102 | `supabase/functions/_shared/idempotency.ts` | Create | função `chaveIdempotencia(codigo, ano, periodo)` + lookup execucoes_integracao | (general) | 101 |
| 103 | `supabase/functions/_shared/fechamento-creator.ts` | Create | função pura `criarFechamentoComVersaoEAnexos()` | (general) | 101, 102 |
| 104 | `supabase/functions/manual-fechamento/index.ts` | Create | handler Deno; valida JWT, chama creator, marca origem='manual' | (general) | 103 |
| 105 | `supabase/functions/signed-url/index.ts` | Create | valida carteira, retorna signed URL TTL=3600 | (general) | 101 |
| 106 | `supabase/config.toml` | Create | configuração de funções (verify_jwt) | (general) | None |
| **— n8n Workflow —** ||||||
| 107 | `n8n/workflows/zeramento_v1.json` | Create | export do workflow (criar via MCP n8n) | (general) | Edge Functions |
| 108 | `n8n/workflows/README.md` | Create | passos para importar/atualizar via MCP | (general) | None |
| **— Tests —** ||||||
| 109 | `tests/unit/format.test.ts` | Create | CNPJ, BRL, datas | (general) | 20 |
| 110 | `tests/unit/status.test.ts` | Create | mapas + transições | (general) | 23 |
| 111 | `tests/unit/hooks/useFechamentos.test.ts` | Create | mock supabase-js + QueryClient wrapper | (general) | 31 |
| 112 | `tests/rls/carteira.spec.sql` | Create | AT-004: analista A não vê empresa B | (general) | 97 |
| 113 | `tests/rls/versao_imutavel.spec.sql` | Create | AT-005: UPDATE em bloqueada=true rejeitado | (general) | 98 |
| 114 | `tests/rls/transicao_status.spec.sql` | Create | AT-009: transições inválidas bloqueadas | (general) | 98 |
| **— Docs —** ||||||
| 115 | `README.md` | Create | setup local: pnpm install, supabase start, supabase functions serve, pnpm dev | (general) | None |

**Total Files:** 115

---

## 7. Agent Assignment Rationale

> Discovered via `Glob(.claude/agents/**/*.md)`: nenhum agente especialista foi encontrado no registry deste projeto.

| Agent | Files Assigned | Rationale |
|-------|----------------|-----------|
| `(general)` | 1–115 (todos) | Nenhum agente especializado em Vite/React/Supabase/n8n encontrado em `.claude/agents/`. O agente Build deve executar diretamente seguindo os patterns deste documento e as KBs `ocvel-frontend` e `ecd`. |

**Agent Discovery:**
- Scanned: `.claude/agents/**/*.md`
- Found: 0 specialists matching this stack
- KB references for build phase: `ocvel-frontend/concepts/*`, `ocvel-frontend/patterns/*`, `ecd/concepts/*`, `ecd/patterns/substituicao-retificacao.md`

**Build agent guidance:**
- Para arquivos shadcn (43–55): rode `npx shadcn@latest add <component>` ao invés de criar manualmente.
- Para `src/types/database.ts` (#21): rode `pnpm supabase gen types typescript --local > src/types/database.ts` após aplicar migrations.
- Para n8n workflow (#107): use o MCP `claude.ai n8n` (`get_sdk_reference` → `search_nodes` → `get_node_types` → `validate_workflow` → `create_workflow_from_code`).
- Para migrations (86–100): aplique via Supabase MCP `apply_migration` ou `supabase db push`.

---

## 8. Code Patterns

### Pattern 1: Supabase client singleton

```ts
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
```

### Pattern 2: TanStack Query hook (lista filtrada por carteira via RLS)

```ts
// src/hooks/useFechamentos.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Filtros {
  ano: number;
  periodo?: "T1" | "T2" | "T3" | "T4" | "ANUAL";
  status?: string;
}

export function useFechamentos(filtros: Filtros) {
  return useQuery({
    queryKey: ["fechamentos", filtros],
    queryFn: async () => {
      let q = supabase
        .from("fechamentos")
        .select(
          `id, ano, periodo, status, origem, criado_em,
           empresa:empresas!inner ( id, codigo_empresa, razao_social, cnpj )`
        )
        .eq("ano", filtros.ano)
        .order("criado_em", { ascending: false });

      if (filtros.periodo) q = q.eq("periodo", filtros.periodo);
      if (filtros.status) q = q.eq("status", filtros.status);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
```

### Pattern 3: RLS policy template (carteira)

```sql
-- supabase/migrations/20260506000012_rls_policies.sql
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;

-- analista/consultoria leem só empresas da carteira; gestor/admin tudo
CREATE POLICY "fechamentos_select_carteira"
  ON fechamentos FOR SELECT
  USING (usuario_tem_empresa(empresa_id));

CREATE POLICY "fechamentos_insert_carteira"
  ON fechamentos FOR INSERT
  WITH CHECK (usuario_tem_empresa(empresa_id));

CREATE POLICY "fechamentos_update_carteira"
  ON fechamentos FOR UPDATE
  USING (usuario_tem_empresa(empresa_id))
  WITH CHECK (usuario_tem_empresa(empresa_id));
```

### Pattern 4: Trigger de imutabilidade da versão

```sql
-- supabase/migrations/20260506000013_triggers_imutabilidade.sql
CREATE OR REPLACE FUNCTION trg_versao_imutavel()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.bloqueada = true
     AND (NEW.valores IS DISTINCT FROM OLD.valores
       OR NEW.numero_versao IS DISTINCT FROM OLD.numero_versao) THEN
    RAISE EXCEPTION 'Versao bloqueada: alteracao nao permitida (versao_id=%)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_fechamento_versao_imutavel
  BEFORE UPDATE ON fechamento_versoes
  FOR EACH ROW EXECUTE FUNCTION trg_versao_imutavel();

CREATE TRIGGER trg_declaracao_versao_imutavel
  BEFORE UPDATE ON declaracao_versoes
  FOR EACH ROW EXECUTE FUNCTION trg_versao_imutavel();
```

### Pattern 5: shadcn component com OCVEL tokens (StatusBadge)

```tsx
// src/components/fechamento/FechamentoStatusBadge.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { STATUS_FECHAMENTO_LABEL } from "@/constants/status";

const variants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        zerado:                "bg-muted text-muted-foreground",
        em_analise:            "bg-accent text-accent-foreground",
        aprovado:              "bg-primary text-primary-foreground",
        reprovado:             "bg-destructive text-destructive-foreground",
        entregue:              "bg-primary text-primary-foreground ring-2 ring-ring/40",
        retificacao_pendente:  "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { status: "zerado" },
  }
);

interface Props
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variants> {
  status: keyof typeof STATUS_FECHAMENTO_LABEL;
}

export function FechamentoStatusBadge({ status, className, ...rest }: Props) {
  return (
    <span className={cn(variants({ status }), className)} {...rest}>
      {STATUS_FECHAMENTO_LABEL[status]}
    </span>
  );
}
```

### Pattern 6: Edge Function `manual-fechamento`

```ts
// supabase/functions/manual-fechamento/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { criarFechamentoComVersaoEAnexos } from "../_shared/fechamento-creator.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  try {
    const payload = await req.json();
    const result = await criarFechamentoComVersaoEAnexos({
      ...payload,
      origem: "manual",
      jwt: authHeader.replace("Bearer ", ""),
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
```

### Pattern 7: n8n webhook node (referência para SDK)

```text
[Webhook /webhook/zeramento]
   │
   ▼
[Set: chave_idempotencia = `${codigo_empresa}|${ano}|${periodo_codigo}`]
   │
   ▼
[Supabase: select execucoes_integracao where chave = $chave]
   │
   ├── existe → [Set status='duplicado'] → [Insert log] → [Respond 200]
   │
   └── não existe →
        [Postgres (banco contábil): execute select parametrizado]
              │
              ▼
        [HTTP Request: POST {SUPABASE_FUNCTIONS_URL}/manual-fechamento]
        (compartilha caminho com fallback manual — Decision 7)
              │
              ├── erro → [Insert execucoes_integracao status='erro']
              └── sucesso → [Insert execucoes_integracao status='sucesso']
```

### Pattern 8: index.html — flicker prevention (KB)

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OCVEL — Painel ECD/ECF</title>
    <script>
      (function () {
        const stored = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (stored === "dark" || (!stored && prefersDark)) {
          document.documentElement.classList.add("dark");
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 9. Integration Points

| External System | Integration Type | Authentication |
|-----------------|------------------|----------------|
| **gClick ERP** | Outbound webhook → n8n `/webhook/zeramento` | Header `X-Webhook-Token` (segredo compartilhado) |
| **Banco contábil (read-only)** | n8n Postgres node, select parametrizado | User read-only PG (segredo n8n) |
| **Supabase Postgres** | supabase-js (frontend) + n8n + Edge Functions | JWT (anon + user) / service_role (server) |
| **Supabase Storage** | upload + signedUrl | JWT + RLS |
| **Supabase Auth** | sign-in email/senha + magic link | email OTP |
| **n8n cloud** | Visual workflow + MCP | API key MCP n8n |

---

## 10. Testing Strategy

| Test Type | Scope | Files | Tools | Coverage Goal |
|-----------|-------|-------|-------|---------------|
| **Unit (TS)** | Funções puras, formatters, mapas de status | `tests/unit/*.test.ts` | Vitest + @testing-library/react | 80% das libs e hooks |
| **Hook integration** | useFechamentos, useUpdateStatus | `tests/unit/hooks/*.test.ts` | Vitest + supabase mock | Happy + erro |
| **RLS / SQL** | AT-004, AT-005, AT-006, AT-009 | `tests/rls/*.spec.sql` | `supabase test db` (pgTAP-like) | 100% das policies críticas |
| **E2E manual** | AT-001, AT-002, AT-003, AT-010 a AT-015 | runbook PT-BR no README | navegador + n8n + supabase local | Happy paths do MVP |
| **Smoke (CI futuro)** | Build + typecheck | GitHub Actions Sprint 2 | `pnpm build`, `tsc --noEmit` | — |

**Mapeamento Acceptance Tests → testes:**

| AT | Tipo | Local |
|----|------|-------|
| AT-001 webhook happy | E2E manual + RLS | runbook + supabase local |
| AT-002 idempotência | Unit (Edge Fn) + E2E | `_shared/idempotency.test.ts` (futuro) + manual |
| AT-003 fallback manual | Unit hook + E2E | `useCriarFechamentoManual` + manual |
| AT-004 RLS carteira | RLS SQL | `tests/rls/carteira.spec.sql` |
| AT-005 versão imutável | RLS SQL | `tests/rls/versao_imutavel.spec.sql` |
| AT-006 retificação RET1 | Unit + manual | hook insert nova versão |
| AT-007 ECD/ECF independente | Unit + RLS | mocked + SQL |
| AT-008 periodicidade | Unit (seeder) | função seed |
| AT-009 historico_status | RLS SQL | `tests/rls/transicao_status.spec.sql` |
| AT-010 perf < 2s | Manual + Lighthouse | runbook |
| AT-011 dark mode | Manual visual | runbook |
| AT-012 PDF restrito | RLS SQL | bucket policy test |
| AT-013 empty state | Unit React | `EmptyState.test.tsx` |
| AT-014 soft-delete | Unit + RLS | mutation + SQL |
| AT-015 falha select | Manual | runbook (banco offline) |

---

## 11. Error Handling

| Error | Handling | Retry? |
|-------|----------|--------|
| RLS denied (PG 42501) | Toast "Sem permissão para esta empresa"; log no console | No |
| Network timeout (supabase) | TanStack Query retry x1 + toast "Conexão lenta, tentando..." | Yes (1x) |
| Storage upload fail | Toast destrutivo + linha mantida em `anexos` com `ativo=false` (rollback) | User-driven |
| Webhook duplicado | n8n branch → marca `execucoes_integracao.status='duplicado'`; HTTP 200 | No |
| Banco contábil offline (AT-015) | n8n marca `execucoes_integracao.status='erro'`; **não cria fechamento parcial**; analista usa fallback manual | n8n retry x2 com backoff |
| Tentativa de UPDATE em versão bloqueada | Trigger `RAISE EXCEPTION` (AT-005); UI toast | No |
| Transição de status inválida | Trigger validação rejeita; UI mostra status válidos no dialog | No |
| Sessão JWT expirada | supabase-js refresh automático; se falhar, redirect /login | Auto |

---

## 12. Configuration

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `VITE_SUPABASE_URL` | string | — | URL do projeto Supabase (frontend) |
| `VITE_SUPABASE_ANON_KEY` | string | — | Anon key Supabase |
| `VITE_FUNCTIONS_URL` | string | `${SUPABASE_URL}/functions/v1` | Base URL das Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | string (server only) | — | Para Edge Functions / n8n |
| `N8N_WEBHOOK_TOKEN` | string | — | Compartilhado entre gClick e n8n |
| `BANCO_CONTABIL_DSN` | string (n8n) | — | Conn string do banco contábil read-only |
| TanStack Query `staleTime` | number | 30_000ms | Em hooks de leitura |
| Storage signed URL TTL | number | 3600s | Edge Function `signed-url` |
| Theme default | enum | `system` | localStorage `theme` |

---

## 13. Security Considerations

- **RLS sempre ativa** em toda tabela do schema `public` (Decision 1). Migrations falham se `ENABLE ROW LEVEL SECURITY` ausente.
- **Service role** usado apenas em Edge Functions e n8n; **nunca** no frontend (Vite expõe envs com prefixo `VITE_`).
- **Bucket privado**: Storage nunca público; URLs sempre signed com TTL ≤ 1h.
- **Imutabilidade de versão entregue** garantida via trigger Postgres (não confiar só em RLS).
- **Webhook token**: gClick → n8n usa header secreto rotacionável.
- **Logs de auditoria**: `historico_status` e `execucoes_integracao` são append-only via RLS (negar UPDATE/DELETE para todos exceto admin).
- **Soft-delete obrigatório**: zero `DELETE` físico em `observacoes` e `anexos`.
- **PT-BR no DDL** não afeta segurança (decisão de DX).
- **Senhas**: zero senhas em código; `.env.example` versionado, `.env` em `.gitignore`.

---

## 14. Observability

| Aspect | Implementation |
|--------|----------------|
| **Logs frontend** | `console.error` + Sentry (futuro). MVP: console + Sonner toast. |
| **Logs n8n** | Console do n8n cloud + tabela `execucoes_integracao` (auditoria de negócio). |
| **Logs Edge Functions** | `supabase functions logs <fn>` (CLI) + Supabase Dashboard. |
| **Logs Postgres** | Supabase Logs explorer; queries lentas via `pg_stat_statements`. |
| **Métricas** | MVP manual: contar linhas em `fechamentos` por status. Sprint 2+: dashboard. |
| **Auditoria de negócio** | `historico_status` (todas transições) + `observacoes` + `execucoes_integracao` (todos webhooks). |

---

## 15. Open Questions Resolution

| ID | Pergunta | Resolução |
|----|----------|-----------|
| Q-1 | Gestor vê todas carteiras? | **Sim** — Decision 10 (todas). Refinar Sprint 2 se necessário. |
| Q-2 | Consultoria modelo de carteira? | **Mesma carteira** com `papel='consultoria'` (Decision 10). |
| Q-3 | Periodicidade MENSAL? | **Não** — apenas T1-T4 e ANUAL (Decision 9). |
| Q-4 | Máquina de estados? | **Definida** em §4.4 com tabela `_transicoes_validas` + trigger. |
| Q-5 | Seed BASSO 2025? | **Migration SQL** (`20260506000015_seed_basso_2025.sql`). |
| Q-6 | Bucket único ou por tipo? | **Único** `anexos` com coluna `tipo_documento` (Decision 5). |
| Q-7 | Path Edge Function vs webhook? | **Mesmo path** via módulo `_shared/fechamento-creator.ts` (Decision 7). |

---

## 16. Build Phase Execution Order

> Sequência recomendada para o agente Build executar o manifesto sem ordem incorreta de dependências.

1. **Bootstrap** (#1–12): `pnpm init`, instalar deps, configs.
2. **Estilos / Design System** (#13): aplicar tokens OCVEL light+dark + `@theme inline`.
3. **Migrations Supabase** (#86–100): aplicar via Supabase MCP (`apply_migration`) na ordem numerada.
4. **Storage bucket** (#99): criar bucket `anexos` privado + policies.
5. **Seed** (#100): inserir BASSO 2025.
6. **Gerar tipos** (#21): `pnpm supabase gen types typescript`.
7. **Edge Functions** (#101–106): implantar `manual-fechamento` e `signed-url` via Supabase MCP / CLI.
8. **n8n workflow** (#107–108): criar via MCP n8n (`create_workflow_from_code`).
9. **Lib + tipos + constantes + auth** (#14–29).
10. **shadcn primitives** (#43–55): `npx shadcn@latest add ...`.
11. **Layout + componentes domínio** (#56–78).
12. **Pages** (#79–85).
13. **Tests** (#109–114).
14. **README** (#115).

---

## 17. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-06 | design-agent | Versão inicial. Cobre 12 tabelas PT-BR, RLS matriz completa, máquina de estados, 10 ADRs inline, manifesto de 115 arquivos, 7 Open Questions resolvidas, mapeamento dos 15 ATs em testes. |

---

## 18. Next Step

**Ready for:** `/build .claude/sdd/features/DESIGN_ECD_PAINEL.md`

O agente Build deve seguir a ordem em §16 e usar:
- **Supabase MCP** para migrations + Edge Functions + Storage.
- **n8n MCP** para o workflow (`zeramento_v1`).
- **shadcn CLI** para componentes primitivos.
- **KBs**: `ocvel-frontend/*` (UI) e `ecd/*` (regras de negócio SPED).

Após Build, atualizar este DESIGN com link para `BUILD_REPORT_ECD_PAINEL.md`.
