# DEFINE: Painel de Controle ECD/ECF e Fechamentos Contábeis

> Painel web auditável para substituir o controle manual em planilha das obrigações ECD/ECF e fechamentos contábeis (mensais/trimestrais/anuais), com permissões por carteira, integração com gClick via n8n e versionamento Original/RETx.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | ECD_PAINEL |
| **Codename** | `ocvel-relatorio-ecd` |
| **Date** | 2026-05-05 |
| **Author** | define-agent |
| **Status** | Complete (Designed) |
| **Clarity Score** | 14/15 |
| **PRD base** | `PRD_SPEC_ECD_ECF_Fechamentos_v1_2.md` (v1.2) |
| **Brainstorm** | `.claude/sdd/features/BRAINSTORM_ECD_PAINEL.md` |
| **Design** | `.claude/sdd/features/DESIGN_ECD_PAINEL.md` |

---

## Problem Statement

A OCVEL controla hoje as obrigações ECD/ECF e os fechamentos contábeis (anuais e trimestrais) das empresas-cliente em uma planilha manual, o que gera erro humano, perda de rastreabilidade (quem zerou, quem analisou, quem entregou), dificulta a visão consolidada do gestor e fragmenta os arquivos PDF (DRE/Balanço/DMPL/DFC/DRA + recibos) entre e-mails e pastas locais. É preciso um painel web auditável que substitua 100% essa planilha, integrado ao gClick (ERP contábil) via n8n e ao banco contábil que produz os relatórios via select parametrizado.

---

## Target Users

| User | Role | Pain Point |
|------|------|------------|
| **Analista contábil** | Operação diária da carteira | Atualiza planilha manualmente; perde rastreabilidade entre versões; sem visão única de PDFs e status |
| **Consultoria** | Análise técnica e parecer | Recebe versões soltas por e-mail; não tem fluxo formal "Enviado → Aprovado/Reprovado" com histórico |
| **Gestor** | Supervisão da operação | Sem visão consolidada de pendências/erros entre carteiras; sem auditoria de quem fez o quê |
| **Admin** | Configuração do sistema | Configurações dispersas em vários sistemas; precisa centralizar usuários, perfis e carteiras |

---

## Goals

| Priority | Goal |
|----------|------|
| **MUST** | Substituir 100% o controle em planilha de fechamentos contábeis (Dashboard Fechamentos — Sprint 1) |
| **MUST** | Controlar status de ECD e ECF anuais de forma independente (Dashboard Declarações — Sprint 2) |
| **MUST** | Aplicar permissões por carteira via RLS no Postgres (não apenas no front) |
| **MUST** | Preservar histórico imutável de versões Original/RET1/RET2 (`bloqueada=true` após entrega) |
| **MUST** | Auditar todas as transições de status em `historico_status` (append-only) desde o MVP |
| **MUST** | Receber webhook gClick → n8n de forma idempotente por `(empresa, ano, período)` |
| **MUST** | Logar 100% das execuções n8n em `execucoes_integracao` (zero "buracos" de auditoria) |
| **MUST** | Centralizar PDFs (DRE/Balanço/DMPL/DFC/DRA + recibos ECD/ECF) no Supabase Storage com RLS |
| **MUST** | Permitir entrada manual de fechamento como fallback quando webhook falhar (best-effort n8n) |
| **SHOULD** | Carregar lista completa de uma carteira (~50 empresas) em < 2s no Dashboard |
| **SHOULD** | Suportar dark-mode via classe `.dark` (KB `ocvel-frontend`) |
| **SHOULD** | Aplicar design system OCVEL (amarelo `oklch(0.8893 0.1777 95.2779)`, radius `1.4rem`, near-flat shadows, Inter) |
| **COULD** | Cadastro inicial de empresas via importação CSV |
| **COULD** | Notificações in-app (Sonner toast) para mutações |

---

## Success Criteria

Outcomes mensuráveis (gates de aceitação do MVP):

- [ ] **SC-01** — 100% do controle em planilha substituído em até 6 meses pós-go-live (medido por desuso da planilha)
- [ ] **SC-02** — Cada par `(empresa, ano, período ∈ {T1, T2, T3, T4, ANUAL})` tem exatamente 1 registro em `fechamentos` com status atualizado em ≤ 24h após zeramento no gClick
- [ ] **SC-03** — Cada par `(empresa, ano, tipo_declaracao ∈ {ECD, ECF})` tem 1 registro em `declaracoes` com status visível e independente
- [ ] **SC-04** — Analista vê **somente** empresas da própria carteira (validado por teste RLS direto no Postgres com JWT do analista, não apenas pelo front)
- [ ] **SC-05** — Versão com `bloqueada=true` **nunca** pode ser sobrescrita (constraint validada por teste de UPDATE rejeitado)
- [ ] **SC-06** — 100% das execuções do webhook n8n geram linha em `execucoes_integracao` (sucesso, falha ou timeout)
- [ ] **SC-07** — Dashboard Fechamentos carrega lista de uma carteira com ~50 empresas em < 2s (p95) com cache frio
- [ ] **SC-08** — PDFs acessíveis em 1 clique via signed URL respeitando RLS do bucket
- [ ] **SC-09** — Webhook idempotente: 2 requisições com mesmo `(codigo_empresa, ano, periodo_codigo)` resultam em 1 fechamento + 2 linhas em `execucoes_integracao` (segunda marcada como duplicada)
- [ ] **SC-10** — `historico_status` registra TODA transição com `(usuario, status_anterior, status_novo, timestamp)` — 0 transições sem log

---

## Acceptance Tests

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| AT-001 | Webhook gClick happy path | Empresa BASSO 2025 cadastrada, periodicidade ANUAL | n8n recebe `POST /webhook/zeramento` com payload válido | Cria `fechamento` (empresa, 2025, ANUAL) + `fechamento_versao` (numero=0) + executa select parametrizado + salva PDFs no Storage + grava `anexos` + log `execucoes_integracao` com status=sucesso |
| AT-002 | Webhook idempotência | Já existe fechamento (BASSO, 2025, ANUAL) | n8n recebe webhook duplicado para mesma chave | Não cria novo fechamento; grava `execucoes_integracao` com status=duplicado e referência ao existente |
| AT-003 | Entrada manual fallback | n8n indisponível, analista logado com BASSO na carteira | Analista clica "Criar fechamento manual" (BASSO, 2025, ANUAL) e faz upload de PDFs | Cria fechamento + versão + anexos diretamente via Supabase client (RLS valida carteira); status inicial = "zerado" |
| AT-004 | RLS por carteira | Analista A com carteira [empresa1]; Analista B com carteira [empresa2] | Analista A executa `SELECT * FROM fechamentos` com seu JWT | Retorna apenas linhas de empresa1; nunca vê empresa2 mesmo via API direta |
| AT-005 | Versão entregue imutável | `fechamento_versoes.bloqueada = true` (Original entregue) | Qualquer usuário tenta UPDATE em campo de valor da versão | UPDATE rejeitado pelo RLS/trigger; toast de erro no front |
| AT-006 | Retificação cria RET1 | Original entregue (bloqueada=true) precisa ser corrigido | Gestor cria nova versão | Cria `fechamento_versoes` com `numero_versao=1`, `bloqueada=false`; original permanece intacta |
| AT-007 | ECD/ECF independência | (BASSO, 2025) com declarações ECD=zerado e ECF=zerado | Usuário muda status ECD para "entregue" | Apenas `declaracoes` (tipo=ECD) é alterada; ECF permanece "zerado"; ambos transitam em `historico_status` |
| AT-008 | Mudança de periodicidade entre anos | Empresa X com periodicidade TRIMESTRAL em 2024 e ANUAL em 2025 | Sistema cria fechamentos para 2025 | Reconhece `empresa_periodicidade(X, 2025)=ANUAL` e cria apenas 1 fechamento ANUAL (não 4 trimestrais) |
| AT-009 | Auditoria histórico_status | Status atual = "em_analise" | Consultoria muda para "aprovado" | Insere linha em `historico_status` com `(user_id, fechamento_id, status_anterior=em_analise, status_novo=aprovado, criado_em=now())` |
| AT-010 | Dashboard performance | Carteira com 50 empresas, ano 2025 | Analista abre Dashboard Fechamentos | Lista renderiza em < 2s (p95) com Skeleton durante load; badges de status corretos |
| AT-011 | Dark mode toggle | UI em light mode | Usuário ativa dark | `<html>` recebe classe `.dark`; tokens trocam via `@custom-variant dark`; brand amarelo permanece visível |
| AT-012 | PDF acesso restrito | Usuário sem carteira para empresa X | Tenta acessar URL de PDF de empresa X via Storage | Supabase nega via RLS de bucket; signed URL não é gerada |
| AT-013 | Empty state | Analista novo sem carteira atribuída | Abre Dashboard Fechamentos | Estado vazio com mensagem "Sem empresas na sua carteira"; sem erro 500 |
| AT-014 | Soft-delete observação | Observação criada em fechamento | Usuário "exclui" observação | `ativo=false`; nunca DELETE físico; histórico preservado para auditoria |
| AT-015 | Falha no select parametrizado | Banco contábil offline durante webhook | n8n tenta executar select | `execucoes_integracao` registra status=erro com mensagem; fechamento NÃO é criado parcialmente; analista pode tentar novamente manualmente |

---

## Out of Scope

Explicitamente **NÃO** incluído nesta feature (MVP / Fase 1):

- Transmissão direta de ECD/ECF para Receita Federal (continua no PGE)
- OCR de PDFs ou extração via LLM (Gemini Vision)
- Aplicativo mobile nativo (web responsivo basta)
- Internacionalização / multi-idioma (100% PT-BR)
- Multi-tenancy (OCVEL é tenant único)
- Cadastro manual de plano de contas (vem do gClick)
- Indicadores SLA, alertas por e-mail, dashboards customizáveis (Fase 3)
- Validações automáticas trimestral × anual (Fase 4)
- Tela comparativa visual lado a lado Original × RET1 (Fase 2)
- Exportação Excel/PDF dos dashboards (Fase 3)
- Comparação banco × PDF (OCR) (Fase 4)
- Checklist obrigatório pré-entrega (Fase 4)
- Botão gestor "Liberar retificação" automático (Fase 2)
- Histórico granular por campo (Fase 2)
- Auth via Auth0/Clerk (usar Supabase Auth nativo)
- Backend Python/Node próprio (toda lógica em n8n + Edge Functions Supabase)
- IaC / Terraform (Supabase + n8n são managed)

---

## Constraints

| Type | Constraint | Impact |
|------|------------|--------|
| **Technical** | Stack obrigatório: Vite + React + TypeScript + Tailwind v4 + shadcn/ui (KB `ocvel-frontend`) | Define estrutura de `src/`, componentes em `src/components/ui/`, páginas em `src/pages/` |
| **Technical** | DB: Supabase Postgres com **tabelas e domínio em PT-BR** | DDL em PT-BR (`empresas`, `fechamentos`, `declaracoes`, `historico_status`, ...); código TS em EN |
| **Technical** | UI 100% PT-BR; código TS em EN; comentários SQL em PT-BR | Sem i18n; strings hardcoded em PT-BR |
| **Technical** | Design system OCVEL: brand `oklch(0.8893 0.1777 95.2779)`, `--radius: 1.4rem`, near-flat shadows (opacity 0.01–0.03), font Inter, dark-mode via `.dark` em `<html>` | `src/index.css` com `@theme inline {}` espelhando tokens da KB; nunca aumentar opacity de shadows |
| **Technical** | RLS no Postgres é mandatório para carteira (RF12) | Policies por tabela e por perfil (analista/consultoria/gestor/admin); validação não pode ser só no front |
| **Technical** | Auditoria desde o MVP: `historico_status` (append-only) + `observacoes` (soft-delete `ativo=false`) + `execucoes_integracao` (jsonb payload/resultado) | Sem DELETE físico; toda mutação de status passa por trigger ou função |
| **Technical** | Webhook gClick → n8n é fonte primária; entrada manual é fallback (best-effort) | Edge Function ou client direto Supabase para criação manual; UI mostra origem (webhook vs manual) |
| **Technical** | Versionamento: Original=0, RET1=1, RET2=2, ...; `bloqueada=true` é imutável | Tabelas `fechamento_versoes` e `declaracao_versoes` separadas; constraint contra UPDATE quando bloqueada |
| **Technical** | Idempotência: webhook não pode duplicar fechamento para mesmo `(empresa, ano, período)` | Unique key + checagem em `execucoes_integracao` antes de inserir |
| **Technical** | Banco contábil gClick é **read-only** — apenas n8n acessa, frontend nunca | Frontend só lê de Supabase; PDFs vêm de Supabase Storage |
| **Technical** | Status como `text` + `CHECK constraint` (não FK para tabela de status) | Lista fixa via migration; alteração exige migration |
| **Infrastructure** | Sem IaC — Supabase + n8n cloud são managed | Configuração via dashboard Supabase + migrations SQL em `supabase/migrations/`; workflows n8n via MCP |
| **Timeline** | MVP em 3-4 sprints (~6-8 semanas), Sprint 1 = Fechamentos, Sprint 2 = Declarações | Priorização rígida; Declarações depende de Fechamentos populados |
| **Resource** | Tenant único OCVEL; sem orçamento para infra adicional além de Supabase + n8n cloud | Toda solução cabe em planos atuais; sem VPS, sem Kubernetes |

---

## Technical Context

> Contexto essencial para a fase Design — evita arquivos mal posicionados e descoberta tardia de necessidades de infra.

| Aspect | Value | Notes |
|--------|-------|-------|
| **Deployment Location** | `src/` (frontend Vite/React) + `supabase/migrations/` (DDL) + n8n cloud (workflows via MCP) | Repositório greenfield `ocvel-relatorio-ecd`; bootstrap Lovable/Vite. Sem `functions/`, `gen/`, `deploy/` típicos do template — projeto é Frontend + BaaS |
| **KB Domains** | `ocvel-frontend` (UI/design system, Tailwind v4, shadcn/ui, dark-mode), `ecd` (regras SPED, blocos, retificação, prazos, regimes tributários) | Design phase deve consultar KB `ocvel-frontend/specs/design-system.yaml` para tokens e `ocvel-frontend/patterns/dark-mode.md` para classe `.dark`. Domínio `ecd` informa enums (status SPED, blocos, regimes) |
| **MCPs Disponíveis** | Supabase MCP (DDL/RLS/policies), n8n MCP (workflows + webhook), Supabase_OCVEL MCP | Migrations aplicadas via MCP `apply_migration`; workflows n8n criados via `create_workflow_from_code` |
| **IaC Impact** | None | Supabase + n8n são managed; configuração via dashboard + migrations SQL. Zero Terraform |
| **Backend Lógica** | n8n workflows (orquestração) + Edge Functions Supabase (callbacks atômicos pontuais) + RLS/triggers Postgres | Sem backend próprio em Python/Node |
| **Storage** | Supabase Storage (bucket privado com RLS) — DRE, BALANCO, DMPL, DFC, DRA, RECIBO_ECD, RECIBO_ECF | `storage_path` referenciado em tabela `anexos` |
| **Auth** | Supabase Auth (email/senha + magic link) | JWT propagado para RLS via `auth.uid()` |

**Why This Matters:**

- **Location** → Greenfield Vite project; toda lógica de UI vai em `src/`; nada em `functions/` ou `gen/`
- **KB Domains** → `ocvel-frontend` + `ecd` são as fontes de verdade para Design phase
- **IaC Impact** → Sem Terraform; Design phase NÃO deve invocar infra-deployer

---

## Assumptions

| ID | Assumption | If Wrong, Impact | Validated? |
|----|------------|------------------|------------|
| A-001 | Volume de webhooks gClick fica < 100/dia (1 por zeramento de empresa) | Custo n8n cloud explode; precisa otimizar/batchar | [ ] |
| A-002 | Select parametrizado do banco contábil retorna em < 30s | Edge Function/n8n excede timeout; precisa job assíncrono | [ ] |
| A-003 | Carteira média de analista ≤ 50 empresas | Dashboard pode precisar paginação/virtualização | [ ] |
| A-004 | Banco contábil gClick aceita 6 parâmetros dinâmicos no select existente | Refatoração maior do select; possível impacto no ERP | [ ] |
| A-005 | Equipe contábil aceita ler SQL com tabelas em PT-BR (decisão #1) | Reverter para EN custa retrabalho de DDL | [x] (confirmado no brainstorm) |
| A-006 | Webhook gClick envia payload com `codigo_empresa`, `ano`, `periodo_codigo`, `arquivos_pdf[]` (formato PRD §RF01) | Contrato precisa ser renegociado com TI do gClick | [ ] |
| A-007 | Supabase RLS suporta a complexidade das policies por perfil × carteira sem queda significativa de performance | Pode precisar de views materializadas ou cache | [ ] |
| A-008 | Empresas-cliente têm CNPJ único e `codigo_empresa` único no gClick | Precisaria chave composta ou normalização | [ ] |
| A-009 | KB `ocvel-frontend` está completa o suficiente para bootstrap sem novas decisões de design | Design phase pode precisar mockups adicionais | [x] (KB tem 10 arquivos cobrindo tokens, shadcn, dark-mode) |
| A-010 | Tenant único OCVEL — não haverá demanda de multi-tenancy nos próximos 12 meses | Schema precisaria coluna `tenant_id` em todas as tabelas | [ ] |
| A-011 | PDFs por fechamento somam ≤ 50MB — cabem no Storage padrão sem CDN externa | Precisaria CDN ou cold storage | [ ] |
| A-012 | Time da consultoria aceita fluxo "Enviado → Aprovado/Reprovado" sem necessidade de comments threaded | Fase 2 traz threading se demandado | [ ] |

**Note:** A-001, A-002, A-004, A-006, A-007 são as assumptions de maior risco — devem ser validadas antes ou no início do Design phase.

---

## Clarity Score Breakdown

| Element | Score (0-3) | Notes |
|---------|-------------|-------|
| Problem | 3 | Claro: substituir planilha manual de ECD/ECF/fechamentos com auditoria e RLS por carteira |
| Users | 3 | 4 perfis identificados com pain points específicos: Analista, Consultoria, Gestor, Admin |
| Goals | 3 | Priorizados em MUST/SHOULD/COULD; 9 MUSTs alinhados ao PRD v1.2 |
| Success | 3 | 10 critérios mensuráveis com números (24h, < 2s, 100%, 0 buracos) |
| Scope | 2 | Out-of-scope explícito (16 itens); MVP bem definido. -1 ponto: validação visual final do design system com usuário ainda pendente (mockup das telas) |
| **Total** | **14/15** | Acima do mínimo (12) — Ready for Design |

---

## Open Questions

Questões residuais que não bloqueiam Design — **todas resolvidas no DESIGN_ECD_PAINEL.md §15**:

1. **Q-1** — Gestor pode acessar TODAS as carteiras ou apenas as carteiras dos analistas que ele supervisiona? → **Resolvida**: gestor vê todas (DESIGN Decision 10).
2. **Q-2** — Consultoria vê apenas empresas atribuídas explicitamente ou todas as que estão em status "em_analise"? → **Resolvida**: mesma carteira com `papel='consultoria'`.
3. **Q-3** — Periodicidade MENSAL existe no domínio ou apenas TRIMESTRAL/ANUAL? → **Resolvida**: apenas T1-T4 e ANUAL (DESIGN Decision 9).
4. **Q-4** — Status permitidos por estado (máquina de estados)? → **Resolvida**: máquina de estados em DESIGN §4.4 + tabela `_transicoes_validas`.
5. **Q-5** — Empresa de seed inicial (BASSO 2025) entra via migration ou CSV? → **Resolvida**: migration `20260506000015_seed_basso_2025.sql`.
6. **Q-6** — Bucket de Storage é único (`anexos`) ou um por tipo? → **Resolvida**: bucket único + `tipo_documento` coluna (DESIGN Decision 5).
7. **Q-7** — Edge Function manual usa o mesmo path que o n8n? → **Resolvida**: mesmo path via módulo `_shared/fechamento-creator.ts` (DESIGN Decision 7).

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-05 | define-agent | Versão inicial extraída do BRAINSTORM_ECD_PAINEL.md (12 questões consolidadas + 15 key decisions + 16 YAGNI). Clarity 14/15. |
| 1.1 | 2026-05-06 | design-agent | Status atualizado para "Complete (Designed)" após geração de DESIGN_ECD_PAINEL.md (115 arquivos no manifesto, 10 ADRs inline, todas as 7 Open Questions resolvidas). |

---

## Next Step

**Ready for:** `/build .claude/sdd/features/DESIGN_ECD_PAINEL.md`

A fase Design foi concluída. Consulte `DESIGN_ECD_PAINEL.md` para:

1. Schema SQL completo das 12 tabelas PT-BR (DESIGN §4)
2. Policies RLS por perfil × tabela (DESIGN §4.6)
3. Contratos de API: webhook n8n + Edge Functions (DESIGN §8 Patterns 6 e 7)
4. Estados de UI por tela (DESIGN §5.3)
5. Máquina de estados de status (DESIGN §4.4)
6. Workflow n8n (DESIGN §8 Pattern 7 + arquivo `n8n/workflows/zeramento_v1.json`)
7. Tokens design system OCVEL em `src/index.css` (DESIGN §8 + KB `ocvel-frontend`)
8. Migrations + seed BASSO 2025 (DESIGN §6 #86–100)
9. Open Questions Q-1 a Q-7 todas resolvidas (DESIGN §15)
