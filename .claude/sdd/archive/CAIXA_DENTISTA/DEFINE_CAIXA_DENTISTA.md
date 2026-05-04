# DEFINE: Caixa Dentista

**Data:** 2026-04-10
**Fase:** 1 - Define
**Input:** BRAINSTORM_CAIXA_DENTISTA.md
**Clarity Score:** 14/15

---

## 1. Problema

Dentistas autonomos que trabalham com uma secretaria precisam de uma forma simples de controlar o fluxo de caixa diario (receitas e despesas). Atualmente nao possuem ferramenta digital acessivel — usam caderno, planilha ou nada. Precisam de algo que funcione no celular e no computador, sem complexidade.

## 2. Usuarios

### Persona: Secretaria do Consultorio
- **Perfil:** Profissional administrativo, nao tecnico
- **Tarefa principal:** Registrar entradas e saidas financeiras ao longo do dia
- **Dor:** Ferramentas complexas demais ou anotacoes em papel que se perdem
- **Necessidade:** Interface simples, rapida, sem termos contabeis

### Persona secundaria: Dentista
- **Perfil:** Profissional autonomo, dono do consultorio
- **Tarefa principal:** Consultar saldo e relatorios mensais
- **Necessidade:** Visao rapida de quanto entrou, quanto saiu, e por categoria

## 3. Objetivos

| # | Objetivo | Metrica |
|---|----------|---------|
| O1 | Registrar receitas e despesas rapidamente | Lancamento em menos de 15 segundos |
| O2 | Visualizar saldo atual do caixa | Saldo visivel na tela principal |
| O3 | Consultar resumo mensal por categoria | Filtro por mes com totais por categoria |
| O4 | Funcionar em celular e computador | Layout responsivo, testado em mobile |

## 4. Requisitos Funcionais

### RF01 - Novo Lancamento
- Formulario com campos: Tipo (Receita/Despesa), Valor, Categoria, Descricao (opcional), Data
- Ao selecionar o tipo, mostrar apenas categorias daquele tipo
- Data padrao: hoje
- Validacao: valor obrigatorio e maior que zero

### RF02 - Lista de Lancamentos (Extrato)
- Listar lancamentos ordenados por data (mais recente primeiro)
- Filtro por mes/ano
- Mostrar saldo do periodo selecionado
- Mostrar saldo geral acumulado
- Cada lancamento mostra: data, tipo (cor), categoria, descricao, valor

### RF03 - Resumo Mensal
- Selecao de mes/ano
- Total de receitas do mes
- Total de despesas do mes
- Resultado do mes (receitas - despesas)
- Tabela com totais por categoria

### RF04 - Categorias Pre-definidas
- 4 categorias de receita: Consulta, Procedimento, Retorno, Outros
- 8 categorias de despesa: Material, Aluguel, Salario, Conta de Luz, Conta de Agua, Internet/Telefone, Manutencao, Outros
- Categorias nao editaveis no MVP

## 5. Requisitos Nao-Funcionais

| # | Requisito | Especificacao |
|---|-----------|---------------|
| RNF01 | Responsividade | Mobile-first, funcionar em telas >= 320px |
| RNF02 | Performance | Carregamento < 2s em 3G |
| RNF03 | Acessibilidade | Botoes grandes, fontes legiveis, contraste adequado |
| RNF04 | Sem autenticacao | Acesso publico pelo link |
| RNF05 | Disponibilidade | Supabase free tier (99.9%) |

## 6. Criterios de Sucesso

| # | Criterio | Teste |
|---|----------|-------|
| CS01 | Secretaria consegue registrar lancamento | Abrir app, preencher formulario, salvar — dado aparece no extrato |
| CS02 | Saldo correto | Somar receitas - despesas = saldo exibido |
| CS03 | Filtro por mes funciona | Selecionar mes, ver apenas lancamentos daquele mes |
| CS04 | Resumo por categoria correto | Totais por categoria batem com lancamentos individuais |
| CS05 | Funciona no celular | Abrir no celular, todas as telas usaveis sem zoom |

## 7. Acceptance Tests

### AT01 - Registrar Receita
```
DADO que a secretaria esta na tela de lancamento
QUANDO seleciona "Receita", valor "150.00", categoria "Consulta", data de hoje
E clica em "Salvar"
ENTAO o lancamento aparece no extrato com os dados corretos
E o saldo aumenta em R$ 150,00
```

### AT02 - Registrar Despesa
```
DADO que a secretaria esta na tela de lancamento
QUANDO seleciona "Despesa", valor "500.00", categoria "Material"
E clica em "Salvar"
ENTAO o lancamento aparece no extrato
E o saldo diminui em R$ 500,00
```

### AT03 - Filtrar por Mes
```
DADO que existem lancamentos em marco e abril
QUANDO seleciona "Abril/2026" no filtro
ENTAO mostra apenas lancamentos de abril
E o saldo do periodo reflete apenas abril
```

### AT04 - Resumo por Categoria
```
DADO que existem 3 consultas (R$ 150 cada) e 1 material (R$ 200) em abril
QUANDO acessa o resumo de abril
ENTAO mostra Receita total: R$ 450, Despesa total: R$ 200
E mostra Consulta: R$ 450, Material: R$ 200
```

## 8. Stack Tecnica

| Componente | Tecnologia |
|------------|------------|
| Frontend | HTML + CSS + JavaScript (vanilla) |
| Backend/API | Supabase (auto-generated REST API) |
| Banco de Dados | PostgreSQL (Supabase) |
| Hospedagem | A definir (Vercel/Netlify/similar) |

## 9. Infraestrutura Existente

- **Projeto Supabase:** caixa-dentista (ID: bjoctdjskejbqugxojmv)
- **Regiao:** sa-east-1 (Sao Paulo)
- **Tabelas criadas:** `categorias`, `lancamentos`
- **RLS:** Habilitado com acesso publico
- **Categorias:** 12 pre-definidas ja inseridas

## 10. Fora de Escopo (YAGNI)

- Autenticacao/login
- Multi-usuario com permissoes
- Exportacao para PDF/Excel
- Integracao com bancos
- Notas fiscais
- Controle de pacientes
- Agendamento
- Edicao/exclusao de categorias
- Dashboard com graficos elaborados

---

## Proximo Passo

```
/design .claude/sdd/features/DEFINE_CAIXA_DENTISTA.md
```
