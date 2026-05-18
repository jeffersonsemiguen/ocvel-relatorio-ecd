# BRAINSTORM: Painel de Controle ECD/ECF e Fechamentos Contábeis

> Sessão exploratória para alinhar intenção, escopo e arquitetura do Painel ECD/ECF antes da fase /define

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | ECD_PAINEL |
| **Codename interno** | `ocvel-relatorio-ecd` |
| **Date** | 2026-05-05 |
| **Author** | brainstorm-agent |
| **Status** | Complete (Defined) — DEFINE_ECD_PAINEL.md criado em 2026-05-05 (clarity 14/15) |
| **PRD base** | `PRD_SPEC_ECD_ECF_Fechamentos_v1_2.md` (v1.2) |

---

## Initial Idea

**Raw Input:**
> "Construir um sistema web para apoiar a conferência/controle das obrigações ECD (Escrituração Contábil Digital) e ECF (Escrituração Contábil Fiscal), além dos fechamentos contábeis (mensais/trimestrais/anuais), substituindo o controle manual feito hoje em planilha."

**Context Gathered:**
- Existe um PRD muito detalhado (v1.2) com modelo de dados, fluxos n8n, RFs e roadmap em 4 fases.
- Existe um "select parametrizado" no banco contábil (gClick) que já busca DRE/Balanço/DMPL/DFC — precisa migrar de parâmetros fixos → dinâmicos.
- A KB do projeto tem domínio dedicado **`ecd/`** (legislação SPED, blocos, retificação, FAQ) — útil para regras de negócio.
- A KB tem domínio **`ocvel-frontend/`** com design system completo (Tailwind v4 + shadcn/ui, paleta amarela/âmbar, `--radius: 1.4rem`, near-flat shadows, dark-mode via `.dark` class).
- Pasta `.claude/sdd/archive/` tem features anteriores (DRE_CONTABIL, CAIXA_DENTISTA) seguindo o mesmo workflow Brainstorm → Define → Design → Build → Shipped.
- Repositório atual tem apenas o PRD e a KB — não há código frontend ainda.

**Technical Context Observed (for Define):**

| Aspect | Observation | Implication |
|--------|-------------|-------------|
| Likely Frontend Location | Repositório novo Vite/React (provavelmente Lovable bootstrap) → `src/` | Componentes shadcn em `src/components/ui/`, páginas em `src/pages/` |
| Likely Backend Location | n8n cloud + Supabase (sem código Python local para MVP) | Workflows n8n versionados via MCP; SQL migrations em `supabase/migrations/` |
| Relevant KB Domains | `ocvel-frontend` (UI), `ecd` (regras SPED), Supabase MCP (DB), n8n MCP (workflows) | Brand: amarelo `oklch(0.8893 0.1777 95.2779)`; radius `1.4rem`; shadows near-flat |
| IaC Patterns | N/A — Supabase managed, n8n cloud | Sem Terraform; configuração via dashboard + migrations SQL |
| Linguagem dos artefatos | DB e domínio em **PT-BR**; código em EN | Tabelas: `empresas`, `fechamentos`, `declaracoes`, `historico_status` |

---

## Discovery Questions & Answers

> O PRD v1.2 já é fruto de uma rodada extensa de descoberta com o usuário. Esta sessão consolida as decisões registradas no PRD e formaliza as 4 perguntas-chave restantes (greenfield vs brownfield, prioridade de dashboard, integração n8n no MVP, e adoção do design system).

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 1 | Qual o problema raiz? | Controle manual em planilha gera erro humano, falta de auditabilidade e dificulta visão consolidada para o gestor. | Sistema deve ter histórico completo e logs desde o MVP. |
| 2 | Quem são os usuários? | 4 perfis: Analista (carteira), Consultoria (parecer), Gestor (visão total) e Admin (config). | RBAC + RLS por carteira no Supabase desde o MVP. |
| 3 | Qual o gatilho do fluxo? | Webhook do gClick (ERP) quando um zeramento ocorre. | Endpoint n8n `/webhook/zeramento` precisa ser idempotente. |
| 4 | Periodicidade varia por empresa? | Sim — ANUAL ou TRIMESTRAL, e pode mudar por ano. | Tabela `empresa_periodicidade` chaveada por `(empresa_id, ano)`. |
| 5 | ECD/ECF têm status independentes? | Sim — alterar ECD não afeta ECF. | Coluna `tipo_declaracao` na `declaracoes` com unique `(empresa_id, ano, tipo_declaracao)`. |
| 6 | Versão entregue pode ser sobrescrita? | Não — gera RET1, RET2… | Coluna `bloqueada boolean` em `fechamento_versoes` e `declaracao_versoes`. |
| 7 | É projeto novo ou tem frontend existente? | **Greenfield** — repositório `ocvel-relatorio-ecd` está vazio (só PRD + KB). | Bootstrap com Vite + React + shadcn/ui seguindo a KB `ocvel-frontend`. |
| 8 | Qual dashboard tem prioridade? | **Dashboard de Fechamentos primeiro** — é o controle operacional do dia-a-dia do analista; o de Declarações depende dos fechamentos estarem populados. | Sprint 1 = Fechamentos; Sprint 2 = Declarações. |
| 9 | n8n é obrigatório no MVP? | **Sim, mas em modo "best-effort"** — webhook opcional + entrada manual coexistem. | Edge Function de fallback permite criar fechamento sem webhook. |
| 10 | Idioma das tabelas e domínio? | **PT-BR** (empresas, fechamentos, declaracoes, historico_status, observacoes, anexos, execucoes_integracao). | DDL em PT-BR; código TS em EN; comentários SQL em PT-BR. |
| 11 | Design system existe? | **Sim** — KB `ocvel-frontend` define tokens Tailwind v4, shadcn/ui, brand amarelo, radius 1.4rem, near-flat shadows. | Frontend deve consumir `src/index.css` com `@theme inline {}` espelhando os tokens da KB. |
| 12 | Qual o critério de sucesso #1? | Substituir 100% o controle em planilha mantendo rastreabilidade (quem zerou, analisou e entregou). | Auditoria (`historico_status`) é requisito MVP, não Fase 2. |

---

## Sample Data Inventory

> Como o sistema é primariamente **CRUD + dashboard** (não LLM-extraction), few-shot prompting não se aplica. Samples aqui servem como fixtures de teste e ground truth para validar o select parametrizado.

| Type | Location | Count | Notes |
|------|----------|-------|-------|
| PRD consolidado | `PRD_SPEC_ECD_ECF_Fechamentos_v1_2.md` | 1 | Fonte primária — DDL completo, payloads, fluxos n8n |
| KB ECD (regras SPED) | `.claude/kb/ecd/` | 18 arquivos | Blocos 0/I/J/K, retificação, prazos, regimes tributários |
| KB Frontend (design system) | `.claude/kb/ocvel-frontend/` | 10 arquivos | Tokens OKLCH, shadcn setup, dark-mode pattern |
| Payload webhook gClick (sample) | `PRD §RF01` | 1 | JSON com `codigo_empresa`, `ano`, `periodo_codigo`, `arquivos_pdf[]` |
| Select parametrizado atual | Banco contábil gClick (externo) | 1 | Hoje com parâmetros fixos — refatorar para 6 parâmetros dinâmicos |
| Empresa exemplo | PRD | 1 | "BASSO EMPREENDIMENTOS IMOBILIÁRIOS LTDA / CNPJ 21.975.559/0001-07 / 2025" |
| Ground truth fechamentos reais | Planilha atual de controle | A obter | Útil para sanity-check do dashboard pós-migração |

**How samples will be used:**
- Webhook payload → fixture para teste do n8n + Edge Function de validação
- Empresa BASSO 2025 → seed inicial no Supabase para validar dashboards
- Planilha atual → comparativo "antes vs depois" para aceitação do usuário
- KB ECD → fonte de verdade para enums (regimes tributários, blocos, status SPED)

---

## Approaches Explored

### Approach A: Vite + React + Supabase + n8n (stack do PRD) ⭐ Recommended

**Description:**
Frontend Vite/React/TypeScript com shadcn/ui (seguindo a KB `ocvel-frontend`), backend Supabase (Postgres + Auth + Storage + RLS) e orquestração n8n via webhook do gClick. Edge Functions Supabase apenas para callbacks pontuais que precisem ser atômicos com o DB.

**Diagrama:**
```
gClick → [webhook] → n8n cloud → Banco Contábil (select parametrizado)
                       ↓
                Supabase Postgres (empresas, fechamentos, declaracoes, ...)
                       ↓
                Supabase Storage (PDFs DRE/Balanço/DMPL/DFC + recibos ECD/ECF)
                       ↓
                Supabase Auth + RLS (carteira)
                       ↓
                Frontend Vite/React (Dashboard Fechamentos + Declarações)
```

**Pros:**
- Aderente ao PRD v1.2 — zero retrabalho de arquitetura
- Supabase RLS resolve carteira por usuário no banco (não só no front) — atende RF12
- n8n já é familiar à equipe e tem MCP disponível neste ambiente
- Stack 100% gerenciada — sem DevOps, sem Terraform, deploy contínuo via Lovable/Vercel
- Design system da KB plug-and-play com Tailwind v4 + shadcn/ui

**Cons:**
- Acoplamento ao gClick via n8n — se gClick mudar contrato, workflow quebra (mitigado por logs em `execucoes_integracao`)
- RLS do Supabase exige cuidado nas policies — fácil errar e vazar dados de carteira
- n8n cloud tem custo por execução (relevante se volume de webhooks crescer muito)

**Why Recommended:**
É a stack já validada no PRD, tem todos os MCPs disponíveis (Supabase, n8n), aproveita 100% da KB existente e não exige IaC. Permite MVP em ~3-4 sprints.

---

### Approach B: Vite + React + Supabase puro (sem n8n no MVP)

**Description:**
Mesmo stack do A, mas **n8n é deferido para Fase 2**. No MVP, o gClick chama diretamente uma Edge Function Supabase, que executa o select via uma `dblink`/foreign data wrapper para o banco contábil OU recebe dados manualmente pelo painel.

**Pros:**
- Reduz dependências externas no MVP (1 sistema a menos)
- Menor latência (sem hop n8n)
- Custo zero adicional (Edge Functions já incluídas no plano Supabase)

**Cons:**
- Edge Function tem timeout de 60s → se select demorar, falha
- Lógica de orquestração (criar fechamento + versão + atualizar declaração + salvar PDFs) fica espalhada em SQL/TS, mais difícil de manter que um workflow visual n8n
- Equipe perde visibilidade dos fluxos (n8n é auto-documentado)
- PRD §3 explicitamente posiciona n8n como camada de orquestração

---

### Approach C: Next.js full-stack + Postgres self-hosted (alternativa "control")

**Description:**
Trocar Vite+Supabase por Next.js (App Router + Server Actions) com Postgres em VPS próprio (sem Supabase). API routes substituem n8n.

**Pros:**
- Zero vendor lock-in
- SSR melhor para SEO (mas painel é interno, então irrelevante)

**Cons:**
- Reinventa Auth, Storage, RLS, realtime — meses de trabalho perdidos
- Não aproveita os MCPs já configurados (Supabase, n8n)
- Não aderente à decisão do PRD §3 ("Lovable/Skip + Supabase + n8n")
- KB `ocvel-frontend` é Vite-first, não Next.js — design system precisaria adaptação

**Why Not Recommended:**
Custo de oportunidade altíssimo sem benefício para um painel interno.

---

## Selected Approach

| Attribute | Value |
|-----------|-------|
| **Chosen** | **Approach A** — Vite + React + Supabase + n8n |
| **User Confirmation** | Pendente — apresentar este BRAINSTORM ao usuário |
| **Reasoning** | Aderente ao PRD v1.2, aproveita KB existente, todos os MCPs disponíveis, sem IaC necessário, MVP factível em 3-4 sprints. |

---

## Key Decisions Made

| # | Decision | Rationale | Alternative Rejected |
|---|----------|-----------|----------------------|
| 1 | Tabelas e domínio em **PT-BR** | Time contábil lê SQL diretamente; reduz fricção de comunicação | Tabelas em EN (mais convencional, mas cria gap entre dev e contador) |
| 2 | Stack: Vite + React + TS + shadcn/ui + Tailwind v4 | Definido na KB `ocvel-frontend` — design system pronto | Next.js (overkill p/ painel interno) |
| 3 | Brand color = amarelo/âmbar OCVEL `oklch(0.8893 0.1777 95.2779)` | Identidade visual da empresa, definida na KB | Cores neutras (perde brand) |
| 4 | Radius `1.4rem` (rounded pill) + near-flat shadows (opacity 0.01-0.03) | Tokens OCVEL — `--radius` e `--shadow-*` em `specs/design-system.yaml` | Material Design defaults |
| 5 | Dark mode via `.dark` em `<html>` + `@custom-variant dark` | Padrão da KB — pattern `dark-mode.md` | next-themes (não existe em Vite) |
| 6 | Auth = Supabase Auth (email/senha + magic link) | Out-of-the-box, integra com RLS | Auth0/Clerk (custo extra) |
| 7 | Permissões = RLS no Postgres + checagem no front | RF12 exige regra no banco | Só no frontend (vazaria dados) |
| 8 | Versionamento de fechamento e declaração via tabelas `*_versoes` separadas | RF08 — original e retificações coexistem | Coluna `versao` na tabela principal (perde histórico) |
| 9 | Histórico de status em tabela única `historico_status` (FK opcionais) | Auditoria centralizada para fechamento E declaração | Tabelas separadas (duplicação) |
| 10 | PDFs em Supabase Storage com `storage_path` na tabela `anexos` | Padrão Supabase, RLS no bucket | Base64 no DB (péssima performance) |
| 11 | Webhook idempotente via `(codigo_empresa, ano, periodo_codigo)` em `execucoes_integracao` | RF01 — "impedir duplicidade indevida" | Hash do payload (mais frágil) |
| 12 | Dashboard de **Fechamentos primeiro**, Declarações depois | Fechamento alimenta declaração — ordem natural | Em paralelo (atrasa MVP) |
| 13 | Periodicidade chaveada por `(empresa_id, ano)` | Empresa pode migrar de trimestral → anual entre exercícios | Coluna fixa em `empresas` (rígido) |
| 14 | Status como **text com CHECK constraint** (não FK para tabela de status) | Lista pequena e estável; mais simples | Tabela `status_fechamento` (overengineering) |
| 15 | Logs n8n em `execucoes_integracao` (jsonb para payload e resultado) | RF11 + facilita debug sem schema rígido | Tabela rígida com 30 colunas |

---

## Features Removed (YAGNI)

> Aplicação rigorosa de YAGNI: tudo que não for crítico para substituir a planilha cai para Fase 2+.

| Feature Suggested | Reason Removed | Can Add Later? |
|-------------------|----------------|----------------|
| Tela comparativa "Original × RET1" lado a lado | Útil mas não bloqueia substituição da planilha — Fase 2 do roadmap | Sim — Fase 2 |
| Indicadores SLA (dias para zerar, dias para entregar) | Métricas só fazem sentido após 3-6 meses de dados — Fase 3 | Sim — Fase 3 |
| Alertas por e-mail de pendências | Painel + filtro "somente pendência" cobre 80% do uso | Sim — Fase 3 |
| Exportação Excel/PDF dos dashboards | Usuário pode usar print/copy-paste no MVP | Sim — Fase 3 |
| Validações automáticas trimestral × anual | Complexidade contábil alta — exige Fase 4 dedicada | Sim — Fase 4 |
| Comparação banco × PDF (OCR/extração) | Sem caso de uso quantificado; demanda Gemini/Vision API | Sim — Fase 4 |
| Checklist obrigatório pré-entrega | Bloqueio dificulta operação no início — adicionar após estabilizar | Sim — Fase 4 |
| Multi-tenancy (várias empresas-cliente compartilhando 1 instância) | OCVEL é tenant único — sem necessidade | Não previsto |
| Integração com Receita Federal (transmissão direta de ECD/ECF) | Já é feita pelo PGE — painel só registra entrega | Não previsto (escopo PGE) |
| Mobile app nativo | Painel web responsivo basta para MVP | Sim — pós Fase 4 |
| Internacionalização (i18n) | 100% PT-BR — empresa brasileira, contadores brasileiros | Não previsto |
| Cadastro manual de plano de contas | Vem do banco contábil via select | Sim se sair do gClick |
| Histórico de alterações de carteira | Auditoria mínima de gestor já cobre | Sim — Fase 2 |
| Dashboards customizáveis por usuário | Filtros padrão atendem MVP | Sim — Fase 3 |
| Tela de configuração de status (admin) | Lista é fixa por CHECK constraint — alteração via migration | Sim se virar requisito |

---

## Incremental Validations

| Section | Presented | User Feedback | Adjusted? |
|---------|-----------|---------------|-----------|
| Arquitetura A vs B vs C | ⏳ pendente | — | — |
| Modelo de dados (12 tabelas em PT-BR) | ⏳ pendente | — | — |
| Priorização Dashboard Fechamentos → Declarações | ⏳ pendente | — | — |
| YAGNI list (16 features removidas) | ⏳ pendente | — | — |

> **Nota:** Validações serão coletadas ao apresentar este documento ao usuário. Mínimo de 2 ciclos antes de prosseguir para `/define`.

---

## Suggested Requirements for /define

### Problem Statement (Draft)
> Substituir o controle manual em planilha das obrigações ECD/ECF e dos fechamentos contábeis (anuais e trimestrais) por um painel web auditável, com permissões por carteira, integrado ao gClick via n8n e ao banco contábil, preservando histórico de versões (Original/RET1/RET2).

### Target Users (Draft)

| User | Pain Point | O que o painel resolve |
|------|------------|------------------------|
| **Analista contábil** | Atualiza planilha manualmente, perde rastreabilidade | Status por período + observações + PDFs centralizados |
| **Consultoria** | Recebe e-mails soltos com versões diferentes | Fluxo "Enviado p/ consultoria → Aprovado" com histórico |
| **Gestor** | Sem visão consolidada de pendências da carteira | Cards superiores + filtro "somente pendência/erro" |
| **Admin** | Configurações dispersas em vários sistemas | Tela única de carteiras, perfis e integrações |

### Success Criteria (Draft)
- [ ] Substituir 100% do controle em planilha em até 6 meses pós-go-live
- [ ] Cada par `(empresa, ano, período)` tem 1 fechamento com status atualizado em ≤ 24h após zeramento no gClick
- [ ] Cada par `(empresa, ano, ECD)` e `(empresa, ano, ECF)` tem status visível e separados
- [ ] Analista vê **somente** empresas da sua carteira (validado via RLS, não só no front)
- [ ] Versão entregue **nunca** é sobrescrita (constraint no banco via `bloqueada=true`)
- [ ] 100% das execuções do n8n geram registro em `execucoes_integracao` (zero "buracos" de auditoria)
- [ ] Dashboard de Fechamentos carrega lista completa de uma carteira (~50 empresas) em < 2s
- [ ] PDFs (DRE/Balanço/DMPL/DFC + recibos) acessíveis em 1 clique, respeitando RLS

### Constraints Identified
- **Stack obrigatório:** Vite + React + TS + Tailwind v4 + shadcn/ui (KB `ocvel-frontend`)
- **DB:** Supabase Postgres com tabelas em **PT-BR**
- **Idioma:** UI 100% PT-BR; código TS em EN
- **Design:** Brand amarelo OCVEL `oklch(0.8893 0.1777 95.2779)`, radius `1.4rem`, near-flat shadows, font Inter, dark-mode via `.dark`
- **Permissões:** RLS no Postgres é mandatório (não pode ser só no front)
- **Auditoria:** `historico_status` + `observacoes` (soft delete) + `execucoes_integracao` desde MVP
- **Integração:** Webhook gClick → n8n é a fonte primária; entrada manual é fallback
- **Versionamento:** Original=0, RET1=1, RET2=2…; versão `bloqueada=true` é imutável
- **Idempotência:** Webhook não pode duplicar fechamento para mesmo `(empresa, ano, período)`
- **Banco contábil é read-only** — só o n8n acessa, nunca o frontend
- **Sem IaC:** Supabase + n8n são managed; configuração via dashboard + migrations SQL

### Out of Scope (Confirmed)
- Transmissão direta de ECD/ECF para a Receita (continua no PGE)
- OCR de PDFs / extração via LLM
- Aplicativo mobile nativo
- i18n / multi-idioma
- Multi-tenancy (várias empresas-cliente)
- Cadastro manual de plano de contas (vem do gClick)
- Indicadores SLA / alertas por e-mail (Fase 3)
- Validações automáticas trimestral × anual (Fase 4)
- Tela comparativa visual Original × RET (Fase 2)
- Exportação Excel/PDF dos dashboards (Fase 3)

---

## Modelo de Dados Resumido (PT-BR)

> Confirmação das 12 tabelas do PRD §10 — **todas em PT-BR** conforme requisito do usuário.

| # | Tabela | Finalidade | Chave única lógica |
|---|--------|------------|---------------------|
| 1 | `empresas` | Cadastro mestre (CNPJ, NIRE, razão social) | `codigo_empresa` |
| 2 | `usuarios_perfis` | Perfil de cada usuário (analista/consultoria/gestor/admin) | `user_id` |
| 3 | `carteira_empresas` | N:N usuário ↔ empresa | `(user_id, empresa_id)` |
| 4 | `empresa_periodicidade` | ANUAL ou TRIMESTRAL por ano | `(empresa_id, ano)` |
| 5 | `fechamentos` | 1 linha por (empresa, ano, T1/T2/T3/T4/ANUAL) | `(empresa_id, ano, periodo_codigo)` |
| 6 | `fechamento_versoes` | Original + RETx com valores DRE/Balanço/DMPL/DFC/DRA | `(fechamento_id, numero_versao)` |
| 7 | `declaracoes` | Controle anual ECD ou ECF | `(empresa_id, ano, tipo_declaracao)` |
| 8 | `declaracao_versoes` | Original + RETx da declaração + recibo | `(declaracao_id, numero_versao)` |
| 9 | `historico_status` | Auditoria de transições (FECHAMENTO/ECD/ECF) | — (append-only) |
| 10 | `observacoes` | Notas por empresa/fechamento/versão/declaração (soft) | — |
| 11 | `anexos` | PDFs no Storage (DRE, BALANCO, DMPL, DFC, DRA, RECIBO_ECD, RECIBO_ECF) | — |
| 12 | `execucoes_integracao` | Log de cada execução n8n (payload + resultado + erro) | — |

**Convenções:**
- PK: `id uuid default gen_random_uuid()`
- Timestamps: `criado_em timestamptz`, `atualizado_em timestamptz`
- Status como `text` + `CHECK` (lista do PRD §RF06 e §RF07)
- Soft-delete: `ativo boolean default true` (não há `DELETE` físico)
- Versionamento: `bloqueada boolean default false` (true após entrega)

---

## Arquitetura de Frontend (resumo)

> Aderente à KB `ocvel-frontend`. Confirmação dos componentes shadcn a usar.

| Tela / Componente | Componentes shadcn | Notas |
|-------------------|---------------------|-------|
| Login | `Card`, `Input`, `Button`, `Label` | Supabase Auth (email + senha) |
| Layout principal | `Sidebar`, `Sheet` (mobile), `DropdownMenu` | Sidebar com cor `--sidebar` + brand yellow ativo |
| Dashboard Fechamentos | `Table`, `Badge`, `Tabs`, `Popover`, `Skeleton` | Badges coloridos por status (✅🟡🔵⚪) |
| Dashboard Declarações | `Card` (KPIs topo), `Table`, `Select` (filtros) | 10 cards de status no topo |
| Detalhe do período | `Dialog` ou `Sheet`, `Accordion`, `Button` (PDF) | Mostrar valores DRE/Balanço/DMPL/DFC/DRA |
| Observações | `Textarea`, `Avatar`, lista cronológica | Sem delete (soft) |
| Histórico | `Table` simples + `Badge` de status anterior/novo | Read-only |
| Carteira (admin) | `DataTable` com paginação | CRUD de `carteira_empresas` |
| Toasts/feedback | `Sonner` (já em shadcn) | Sucesso/erro de mutações |

**Tokens críticos a respeitar (KB):**
- `--primary`: amarelo brand (badges de status "Concluído", botão CTA)
- `--destructive`: usar para "Com erro", "Retificação necessária"
- `--muted-foreground`: timestamps, metadata
- `--radius` 1.4rem: TODOS cards/inputs/buttons (não usar `rounded-full` em cards)
- Shadows opacity 0.01–0.03: nunca aumentar (quebra identidade visual)
- Font: Inter (sans, serif e mono apontam pra Inter)

---

## Roadmap Confirmado

### Fase 1 — MVP (este projeto, foco do /define)
- Schema Supabase (12 tabelas PT-BR + índices §11) com RLS
- Auth + perfis + carteira
- Importação inicial de empresas (CSV ou seed)
- **Dashboard Fechamentos** (sprint 1)
- **Dashboard Declarações** (sprint 2)
- Webhook n8n + select parametrizado dinâmico
- Upload e download de PDFs (Storage)
- Status + observações + `historico_status`
- Logs em `execucoes_integracao`

### Fase 2 — Auditoria avançada (pós-MVP)
- Retificações controladas (botão "Liberar retificação" do gestor)
- Bloqueio automático após `entregue`
- Tela comparativa Original × RET1
- Histórico granular por campo

### Fase 3 — Gestão (3-6 meses pós-MVP)
- Indicadores por responsável e carteira
- SLA por obrigação
- Alertas de pendência (e-mail)
- Exportação Excel/PDF

### Fase 4 — Validações automáticas
- Comparação trimestral × anual
- Alerta de divergência
- Comparação banco × PDF
- Checklist pré-entrega

---

## Session Summary

| Metric | Value |
|--------|-------|
| Questões consolidadas | 12 |
| Approaches Explored | 3 |
| Features Removed (YAGNI) | 16 |
| Tabelas no modelo (PT-BR) | 12 |
| Validations pendentes | 4 |
| Fases no roadmap | 4 (MVP é Fase 1) |
| Sprint estimado MVP | 3-4 sprints (~6-8 semanas) |

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-05-05 | Versão inicial criada por brainstorm-agent |
| 1.1 | 2026-05-05 | Status atualizado para "Complete (Defined)" — DEFINE_ECD_PAINEL.md gerado com clarity 14/15 |

---

## Next Step

**✅ Define concluído:** `.claude/sdd/features/DEFINE_ECD_PAINEL.md` (clarity 14/15)

**Próximo:** `/design .claude/sdd/features/DEFINE_ECD_PAINEL.md`

A fase /define entregou:
1. ✅ 12 itens de "Key Decisions Made" convertidos em goals MUST/SHOULD/COULD com critérios mensuráveis (10 success criteria)
2. ✅ 15 acceptance tests cobrindo webhook, idempotência, RLS, versionamento, periodicidade, dark-mode e empty states
3. ✅ Contexto técnico documentado (deployment location, KB domains, IaC=None)
4. ✅ 12 assumptions com risco classificado (5 críticas a validar antes do Design)
5. ✅ 7 Open Questions residuais para resolver no início do Design

A fase /design deverá:
1. Detalhar contratos de API (endpoints n8n + Edge Functions Supabase)
2. Especificar policies RLS para cada tabela e perfil (analista/consultoria/gestor/admin)
3. Detalhar estados do dashboard (loading, empty, error, populated)
4. Mapear permissões por tela × perfil (matriz)
5. Definir migrations SQL iniciais com seed de empresa de teste (BASSO 2025)
6. Confirmar com usuário a validação final do design system aplicado às telas (mockup ou wireframe textual)
