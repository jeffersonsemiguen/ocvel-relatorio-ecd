# BRAINSTORM: DRE Contabil

**Data:** 2026-04-10
**Status:** Concluido

---

## Ideia

Adicionar uma 4a tab "DRE" ao app Caixa do Dentista, exibindo a Demonstracao do Resultado do Exercicio com visao mensal e acumulada no ano. Usa os dados de lancamentos ja existentes no Supabase.

## Contexto

- **App existente:** Caixa do Dentista (index.html) com 3 tabs (Lancamento, Extrato, Resumo)
- **Banco:** Supabase com tabelas `categorias` e `lancamentos`
- **Projeto Supabase:** bjoctdjskejbqugxojmv

## Decisoes Tomadas

### 1. Nivel de Detalhe
DRE intermediaria com as linhas:
- Receita Bruta
- (-) Impostos (percentual configuravel)
- (=) Receita Liquida
- (-) Custos (Material, Manutencao)
- (=) Lucro Bruto
- (-) Despesas Operacionais (Aluguel, Salario, Contas, Internet, Outros)
- (=) Resultado Operacional

### 2. Classificacao das Categorias

**Custos (ligados ao servico):**
- Material
- Manutencao

**Despesas Operacionais (administrativas):**
- Aluguel
- Salario
- Conta de Luz
- Conta de Agua
- Internet/Telefone
- Outros (Despesa)

### 3. Impostos
Percentual fixo configuravel pelo usuario (default 15%, referencia Simples Nacional). Campo no topo da DRE.

### 4. Periodo
Duas colunas: Mes selecionado e Acumulado no ano (Jan ate o mes selecionado).

## YAGNI — Removido do Escopo

- Comparacao entre periodos (mes anterior, ano anterior)
- Exportacao da DRE para PDF
- Margem percentual em cada linha
- Graficos na DRE
- Multiplas aliquotas de imposto por tipo de receita
- DRE por regime de competencia (usa regime de caixa, que e o que o app ja faz)

## Proximo Passo

`/define .claude/sdd/features/BRAINSTORM_DRE_CONTABIL.md`
