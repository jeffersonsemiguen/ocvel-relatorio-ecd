# DESIGN: DRE Contabil

**Data:** 2026-04-10
**Fase:** 2 - Design
**Input:** DEFINE_DRE_CONTABIL.md

---

## 1. Arquitetura

Nao muda. Continua sendo 1 arquivo `index.html` com Supabase via CDN. A DRE e uma 4a tab que reutiliza a mesma query de lancamentos.

```
index.html (SPA)
├── Tab: Lancamento  (existente, sem alteracao)
├── Tab: Extrato     (existente, sem alteracao)
├── Tab: Resumo      (existente, sem alteracao)
└── Tab: DRE         (NOVO)
     ├── Campo aliquota (%) → localStorage
     ├── Filtro de mes
     ├── Query Supabase (mes + acumulado ano)
     ├── Calculo DRE no JS
     └── Render tabela com 2 colunas (Mes | Acumulado)
```

---

## 2. Fluxo de Dados - DRE

```
Seleciona mes/ano
  -> GET lancamentos do mes (com categoria)
  -> GET lancamentos de Jan ate o mes (acumulado ano)
  -> Le aliquota do localStorage (default 15%)
  -> Calcula DRE:
     Receita Bruta
     (-) Impostos = Receita Bruta * aliquota%
     (=) Receita Liquida
     (-) Custos (categorias: Material, Manutencao)
     (=) Lucro Bruto
     (-) Desp. Operacionais (categorias: Aluguel, Salario, Contas, Internet, Outros)
     (=) Resultado Operacional
  -> Renderiza tabela com colunas Mes e Acumulado
```

---

## 3. Design de Interface - Tab DRE

```
+--------------------------------------------+
|  Aliquota de Imposto: [15] %               |
+--------------------------------------------+
|  Mes: [Abril/2026  v]                      |
+--------------------------------------------+
|                          Mes     Acumulado  |
|  ────────────────────────────────────────── |
|  Receita Bruta        3.450,00  12.800,00  |
|  (-) Impostos (15%)    -517,50  -1.920,00  |
|  ────────────────────────────────────────── |
|  = Receita Liquida    2.932,50  10.880,00  |
|                                             |
|  (-) Custos                                 |
|    Material             -400,00  -1.200,00  |
|    Manutencao           -150,00    -600,00  |
|  Total Custos           -550,00  -1.800,00  |
|  ────────────────────────────────────────── |
|  = Lucro Bruto        2.382,50   9.080,00  |
|                                             |
|  (-) Desp. Operacionais                     |
|    Aluguel            -1.500,00  -6.000,00  |
|    Salario              -300,00  -1.200,00  |
|    Conta de Luz          -80,00    -320,00  |
|    Conta de Agua         -40,00    -160,00  |
|    Internet/Telefone    -100,00    -400,00  |
|  Total Desp. Op.      -2.020,00  -8.080,00 |
|  ────────────────────────────────────────── |
|  = RESULTADO            362,50   1.000,00  |
+--------------------------------------------+
```

### Estilos Visuais da DRE

- Linhas de subtotal (Receita Liquida, Lucro Bruto, Resultado): **negrito**, fundo levemente cinza
- Resultado positivo: **verde** | Resultado negativo: **vermelho**
- Linhas de detalhe (categorias): fonte menor, indentada
- Separadores entre blocos: borda cinza fina
- Campo aliquota: input pequeno inline com label

---

## 4. Decisoes Tecnicas

### Decisao: Mapeamento fixo categoria → grupo DRE

| Atributo | Valor |
|----------|-------|
| **Status** | Aceito |
| **Data** | 2026-04-10 |

**Escolha:** Mapear categorias por nome no JS:

```javascript
const CUSTOS = ['Material', 'Manutencao']
// Tudo que e despesa e nao esta em CUSTOS = Despesa Operacional
```

**Justificativa:** Simples, sem alterar banco. Categorias sao fixas no MVP.

### Decisao: Aliquota no localStorage

| Atributo | Valor |
|----------|-------|
| **Status** | Aceito |
| **Data** | 2026-04-10 |

**Escolha:** Salvar `aliquota_imposto` no localStorage.

**Justificativa:** Evita criar tabela de configuracao no Supabase. Para 1 unico campo, localStorage e suficiente.

### Decisao: Duas queries paralelas para Mes e Acumulado

| Atributo | Valor |
|----------|-------|
| **Status** | Aceito |
| **Data** | 2026-04-10 |

**Escolha:** Fazer 2 queries em paralelo (Promise.all): uma para o mes e outra para Jan-Mes.

**Justificativa:** Mais eficiente que buscar o ano inteiro e filtrar no JS.

---

## 5. File Manifest

| # | Arquivo | Acao | Proposito | Dependencias |
|---|---------|------|-----------|--------------|
| 1 | `index.html` | Modificar | Adicionar tab DRE (HTML + CSS + JS) | Nenhuma nova |

### Alteracoes no index.html

**CSS (adicionar):**
- `.dre-table` — tabela da DRE
- `.dre-row`, `.dre-row-subtotal`, `.dre-row-resultado` — linhas
- `.dre-indent` — linhas de detalhe indentadas
- `.dre-config` — bloco do campo aliquota

**HTML (adicionar):**
- Tab "DRE" na barra de tabs
- `div#tab-dre` com campo aliquota, filtro mes, tabela DRE

**JS (adicionar):**
- `CUSTOS` — array com nomes de categorias de custo
- `loadDRE()` — busca dados e calcula DRE
- `calcularDRE(lancamentos, aliquota)` — logica de calculo
- `renderDRE(dreMes, dreAcumulado)` — renderiza tabela

**JS (modificar):**
- `setupTabs()` — adicionar `if (target === 'dre') loadDRE()`
- `setupMesFilters()` — adicionar filtro para DRE

---

## 6. Padroes de Codigo

### Constante de mapeamento
```javascript
const CUSTOS = ['Material', 'Manutencao']
```

### Funcao de calculo
```javascript
function calcularDRE(lancamentos, aliquota) {
  const receitas = lancamentos.filter(l => l.tipo === 'receita')
  const despesas = lancamentos.filter(l => l.tipo === 'despesa')

  const receitaBruta = receitas.reduce((s, l) => s + Number(l.valor), 0)
  const impostos = receitaBruta * (aliquota / 100)
  const receitaLiquida = receitaBruta - impostos

  const custos = {}
  const despOp = {}
  despesas.forEach(l => {
    const nome = l.categorias?.nome || 'Outros (Despesa)'
    const val = Number(l.valor)
    if (CUSTOS.includes(nome)) {
      custos[nome] = (custos[nome] || 0) + val
    } else {
      despOp[nome] = (despOp[nome] || 0) + val
    }
  })

  const totalCustos = Object.values(custos).reduce((s, v) => s + v, 0)
  const lucroBruto = receitaLiquida - totalCustos
  const totalDespOp = Object.values(despOp).reduce((s, v) => s + v, 0)
  const resultado = lucroBruto - totalDespOp

  return { receitaBruta, impostos, receitaLiquida, custos, totalCustos, lucroBruto, despOp, totalDespOp, resultado }
}
```

### Query de acumulado no ano
```javascript
async function loadDRE() {
  const mes = document.getElementById('filtro-mes-dre').value
  const [year] = mes.split('-')
  const { inicio, fim } = getMesRange(mes)
  const inicioAno = `${year}-01-01`

  const aliquota = parseFloat(localStorage.getItem('aliquota_imposto') || '15')

  const [mesResult, anoResult] = await Promise.all([
    supabase.from('lancamentos').select('*, categorias(nome)').gte('data', inicio).lt('data', fim),
    supabase.from('lancamentos').select('*, categorias(nome)').gte('data', inicioAno).lt('data', fim)
  ])

  const dreMes = calcularDRE(mesResult.data || [], aliquota)
  const dreAcumulado = calcularDRE(anoResult.data || [], aliquota)
  renderDRE(dreMes, dreAcumulado, aliquota)
}
```

---

## 7. Estrategia de Teste

| Tipo | Escopo | Como |
|------|--------|------|
| Manual | Calculos DRE | Inserir lancamentos conhecidos, verificar valores |
| Manual | Aliquota | Alterar %, recarregar pagina, verificar persistencia |
| Manual | Acumulado | Inserir em meses diferentes, verificar soma |
| Manual | Mobile | Verificar DRE legivel no celular |
| Manual | Tabs | Verificar que as 3 tabs antigas continuam funcionando |

---

## Proximo Passo

```
/build .claude/sdd/features/DESIGN_DRE_CONTABIL.md
```
