# DEFINE: DRE Contabil

**Data:** 2026-04-10
**Fase:** 1 - Define
**Input:** BRAINSTORM_DRE_CONTABIL.md
**Clarity Score:** 14/15

---

## 1. Problema

O app Caixa do Dentista ja registra receitas e despesas com categorias, mas nao oferece uma visao contabil estruturada. O dentista precisa enxergar seus numeros no formato DRE (Demonstracao do Resultado do Exercicio) para entender receita liquida, custos, lucro bruto e resultado operacional — sem precisar de um contador para montar esse relatorio.

## 2. Usuarios

### Persona: Dentista (usuario primario da DRE)
- **Tarefa:** Consultar a saude financeira do consultorio no formato contabil
- **Necessidade:** Ver de forma clara quanto sobra apos impostos, custos e despesas

### Persona: Secretaria
- **Tarefa:** Continua registrando lancamentos (nao muda nada para ela)
- **Interacao com DRE:** Pode consultar se o dentista pedir

## 3. Objetivos

| # | Objetivo | Metrica |
|---|----------|---------|
| O1 | Exibir DRE intermediaria com 7 linhas principais | Todas as linhas calculadas corretamente |
| O2 | Permitir configurar aliquota de imposto | Campo editavel com default 15% |
| O3 | Mostrar visao mensal e acumulada no ano | Duas colunas lado a lado |
| O4 | Integrar como 4a tab no app existente | Sem quebrar as 3 tabs atuais |

## 4. Requisitos Funcionais

### RF01 - Tab DRE
- Adicionar 4a tab "DRE" ao app existente
- Manter as 3 tabs atuais funcionando normalmente
- Filtro de mes/ano (igual ao Extrato e Resumo)

### RF02 - Campo de Aliquota de Imposto
- Input numerico no topo da DRE
- Default: 15%
- Salvar no localStorage para persistir entre sessoes
- Recalcular DRE ao alterar o valor

### RF03 - Calculo da DRE
Estrutura de linhas:

```
Receita Bruta              = soma de todos lancamentos tipo "receita" do periodo
(-) Impostos               = Receita Bruta x aliquota%
(=) Receita Liquida        = Receita Bruta - Impostos

(-) Custos
    Material               = soma lancamentos categoria "Material"
    Manutencao             = soma lancamentos categoria "Manutencao"
    Total Custos           = Material + Manutencao
(=) Lucro Bruto            = Receita Liquida - Total Custos

(-) Despesas Operacionais
    Aluguel                = soma lancamentos categoria "Aluguel"
    Salario                = soma lancamentos categoria "Salario"
    Conta de Luz           = soma lancamentos categoria "Conta de Luz"
    Conta de Agua          = soma lancamentos categoria "Conta de Agua"
    Internet/Telefone      = soma lancamentos categoria "Internet/Telefone"
    Outros (Despesa)       = soma lancamentos categoria "Outros (Despesa)"
    Total Desp. Op.        = soma de todas acima
(=) Resultado Operacional  = Lucro Bruto - Total Desp. Operacionais
```

### RF04 - Duas Colunas de Periodo
- **Coluna "Mes":** Dados do mes selecionado no filtro
- **Coluna "Acumulado":** Dados de Janeiro ate o mes selecionado (mesmo ano)

### RF05 - Classificacao de Categorias
Mapeamento fixo no codigo:

| Categoria | Grupo DRE |
|-----------|-----------|
| Material | Custo |
| Manutencao | Custo |
| Aluguel | Despesa Operacional |
| Salario | Despesa Operacional |
| Conta de Luz | Despesa Operacional |
| Conta de Agua | Despesa Operacional |
| Internet/Telefone | Despesa Operacional |
| Outros (Despesa) | Despesa Operacional |

## 5. Requisitos Nao-Funcionais

| # | Requisito | Especificacao |
|---|-----------|---------------|
| RNF01 | Responsividade | Tabela DRE legivel em mobile (scroll horizontal se necessario) |
| RNF02 | Performance | Calculos no frontend, sem RPC adicional |
| RNF03 | Compatibilidade | Nao alterar logica das 3 tabs existentes |
| RNF04 | Persistencia | Aliquota salva em localStorage |

## 6. Criterios de Sucesso

| # | Criterio | Teste |
|---|----------|-------|
| CS01 | DRE calcula corretamente | Receita Bruta - Impostos - Custos - Desp.Op. = Resultado |
| CS02 | Aliquota configuravel | Alterar %, DRE recalcula imediatamente |
| CS03 | Acumulado correto | Acumulado = soma de Jan ate mes selecionado |
| CS04 | Tabs existentes intactas | Lancamento, Extrato e Resumo continuam funcionando |
| CS05 | Legivel no celular | DRE visivel sem zoom no mobile |

## 7. Acceptance Tests

### AT01 - DRE Mensal Correta
```
DADO que em Abril existem:
  - 3 consultas de R$ 150 (receita = R$ 450)
  - 1 material de R$ 100 (custo)
  - 1 aluguel de R$ 200 (desp. operacional)
  E aliquota de imposto = 10%
QUANDO acessa DRE de Abril
ENTAO mostra:
  Receita Bruta: R$ 450,00
  (-) Impostos (10%): -R$ 45,00
  Receita Liquida: R$ 405,00
  (-) Custos: -R$ 100,00
  Lucro Bruto: R$ 305,00
  (-) Desp. Operacionais: -R$ 200,00
  Resultado: R$ 105,00
```

### AT02 - Acumulado no Ano
```
DADO que em Marco houve R$ 1.000 de receita e em Abril R$ 500
QUANDO acessa DRE de Abril
ENTAO coluna "Acumulado" mostra Receita Bruta = R$ 1.500
E coluna "Mes" mostra Receita Bruta = R$ 500
```

### AT03 - Alterar Aliquota
```
DADO que a DRE esta exibida com 15%
QUANDO altera aliquota para 6%
ENTAO a linha de Impostos recalcula imediatamente
E o valor persiste ao recarregar a pagina
```

## 8. Constraintes

- Modificar apenas o arquivo `index.html` existente
- Nao alterar o schema do banco de dados
- Nao adicionar novas dependencias (somente Supabase JS que ja esta em uso)
- Mapeamento de categorias para grupos DRE e fixo no codigo

## 9. Fora de Escopo (YAGNI)

- Comparacao entre periodos (mes anterior, ano anterior)
- Exportacao da DRE para PDF
- Margem percentual em cada linha
- Graficos na DRE
- Multiplas aliquotas de imposto por tipo de receita
- DRE por regime de competencia
- Edicao do mapeamento categoria-grupo pelo usuario

---

## Proximo Passo

```
/design .claude/sdd/features/DEFINE_DRE_CONTABIL.md
```
