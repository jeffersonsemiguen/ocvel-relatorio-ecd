# BRAINSTORM: Caixa Dentista

**Data:** 2026-04-10
**Status:** Concluido

---

## Ideia

Aplicacao web simples de controle financeiro (livro-caixa) para dentistas autonomos. Registro de receitas e despesas com categorias pre-definidas, acessivel por celular e computador.

## Contexto

- **Usuario principal:** Secretaria do dentista
- **Acesso:** Sem login, qualquer um com o link acessa
- **Dispositivos:** Celular e computador (responsivo)
- **Complexidade:** Minima — formulario + extrato + resumo

## Decisoes Tomadas

### 1. Quem usa?
Secretaria e a usuaria principal. Interface deve ser simples e sem termos tecnicos.

### 2. Categorias
Categorias pre-definidas (nao editaveis pelo usuario no MVP):

**Receita:** Consulta, Procedimento, Retorno, Outros
**Despesa:** Material, Aluguel, Salario, Conta de Luz, Conta de Agua, Internet/Telefone, Manutencao, Outros

### 3. Relatorios
- Saldo atual
- Resumo mensal (total receitas x despesas)
- Detalhamento por categoria

### 4. Autenticacao
Sem login. Acesso publico pelo link.

### 5. Tecnologia
- **Frontend:** HTML/CSS/JS (simples, responsivo)
- **Backend:** Supabase (PostgreSQL + API automatica)
- **Hospedagem:** A definir (Vercel ou similar, gratuito)

## Infraestrutura Criada

### Supabase
- **Projeto:** caixa-dentista
- **ID:** bjoctdjskejbqugxojmv
- **Organizacao:** RDD
- **Regiao:** sa-east-1 (Sao Paulo)
- **Custo:** $0/mes (plano gratuito)

### Banco de Dados
- Tabela `categorias` (id, nome, tipo, created_at)
- Tabela `lancamentos` (id, tipo, valor, categoria_id, descricao, data, created_at)
- RLS habilitado com politica de acesso publico
- 12 categorias pre-definidas inseridas

## Telas (3)

1. **Lancamento** — Formulario: tipo (Receita/Despesa), valor, categoria, descricao, data
2. **Extrato** — Lista de lancamentos com filtro por mes + saldo atual
3. **Resumo** — Tabela/grafico mensal por categoria

## YAGNI — Removido do Escopo

- Autenticacao/login
- Multi-usuario com permissoes
- Exportacao para PDF/Excel
- Integracao com bancos
- Notas fiscais
- Controle de pacientes
- Agendamento

## Proximo Passo

`/define .claude/sdd/features/BRAINSTORM_CAIXA_DENTISTA.md`
