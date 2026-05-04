# DESIGN: Caixa Dentista

**Data:** 2026-04-10
**Fase:** 2 - Design
**Input:** DEFINE_CAIXA_DENTISTA.md

---

## 1. Arquitetura

```
+--------------------------------------------------+
|                  BROWSER                          |
|  (Mobile ou Desktop)                              |
|                                                   |
|  +----------------------------------------------+ |
|  |           index.html (SPA)                   | |
|  |                                               | |
|  |  [Tab: Lancamento] [Tab: Extrato] [Tab: Resumo]|
|  |                                               | |
|  |  +------------------------------------------+ | |
|  |  |              app.js                      | | |
|  |  |  - renderForm()                          | | |
|  |  |  - renderExtrato()                       | | |
|  |  |  - renderResumo()                        | | |
|  |  |  - supabaseClient                        | | |
|  |  +------------------------------------------+ | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
            |  REST API (fetch)
            v
+--------------------------------------------------+
|              SUPABASE                             |
|  URL: bjoctdjskejbqugxojmv.supabase.co           |
|                                                   |
|  +-------------------+  +---------------------+  |
|  |   categorias      |  |   lancamentos       |  |
|  |   - id            |  |   - id              |  |
|  |   - nome          |  |   - tipo            |  |
|  |   - tipo          |  |   - valor           |  |
|  |   - created_at    |  |   - categoria_id FK |  |
|  +-------------------+  |   - descricao       |  |
|                          |   - data            |  |
|                          |   - created_at      |  |
|                          +---------------------+  |
+--------------------------------------------------+
```

### Decisao: Single Page Application (SPA) com HTML puro

| Atributo | Valor |
|----------|-------|
| **Status** | Aceito |
| **Data** | 2026-04-10 |

**Contexto:** Precisamos de algo simples, leve e sem build step.

**Escolha:** Um unico `index.html` com CSS inline e JS embutido, navegacao por tabs.

**Justificativa:** Zero dependencias, zero build, deploy como arquivo estatico. A secretaria abre o link e funciona.

**Alternativas Rejeitadas:**
1. Next.js/React — complexidade desnecessaria para 3 telas
2. Vue/Svelte — ainda requer build step
3. Multi-page — navegacao mais lenta, multiplos arquivos

**Consequencias:**
- Sem framework = sem componentes reutilizaveis (aceitavel para 3 telas)
- Todo o codigo em um arquivo (aceitavel para ~400 linhas)

---

## 2. Fluxo de Dados

### Lancamento (Escrita)
```
Secretaria preenche form
  -> Valida campos (JS)
  -> POST /rest/v1/lancamentos (Supabase REST)
  -> Atualiza extrato na tela
```

### Extrato (Leitura)
```
Seleciona mes/ano
  -> GET /rest/v1/lancamentos?data=gte.{inicio}&data=lt.{fim}
  -> GET /rest/v1/lancamentos (saldo geral via RPC ou calculo local)
  -> Renderiza lista + saldo
```

### Resumo (Leitura Agregada)
```
Seleciona mes/ano
  -> GET /rest/v1/lancamentos?select=*,categorias(nome)&data=gte.{inicio}&data=lt.{fim}
  -> Agrupa por categoria no JS
  -> Renderiza tabela de totais
```

---

## 3. Design de Interface

### Layout Mobile-First

```
+---------------------------+
|     Caixa do Dentista     |  <- Header fixo
+---------------------------+
| [Lancamento] [Extrato] [Resumo] | <- Tabs
+---------------------------+
|                           |
|   (conteudo da tab ativa) |
|                           |
+---------------------------+
```

### Tab Lancamento
```
+---------------------------+
|  Tipo:                    |
|  ( ) Receita  ( ) Despesa |
|                           |
|  Valor: R$                |
|  [____________]           |
|                           |
|  Categoria:               |
|  [v Selecione...]         |
|                           |
|  Descricao (opcional):    |
|  [____________]           |
|                           |
|  Data:                    |
|  [dd/mm/aaaa]             |
|                           |
|  [    SALVAR    ]         |
+---------------------------+
```

### Tab Extrato
```
+---------------------------+
|  Mes: [Abril/2026  v]     |
+---------------------------+
|  Saldo do mes: R$ 1.250   |
|  Saldo geral:  R$ 8.430   |
+---------------------------+
|  10/04  Consulta    +150  |  <- verde
|  09/04  Material    -200  |  <- vermelho
|  08/04  Consulta    +150  |
|  07/04  Aluguel   -2.500  |
|  ...                      |
+---------------------------+
```

### Tab Resumo
```
+---------------------------+
|  Mes: [Abril/2026  v]     |
+---------------------------+
|  Receitas:    R$ 3.450    |  <- verde
|  Despesas:    R$ 2.200    |  <- vermelho
|  Resultado:   R$ 1.250    |
+---------------------------+
|  RECEITAS                 |
|  Consulta        R$ 2.700 |
|  Procedimento    R$   600 |
|  Retorno         R$   150 |
+---------------------------+
|  DESPESAS                 |
|  Aluguel         R$ 1.500 |
|  Material        R$   400 |
|  Salario         R$   300 |
+---------------------------+
```

### Paleta de Cores
```
Fundo:      #f5f5f5
Card:       #ffffff
Receita:    #16a34a (verde)
Despesa:    #dc2626 (vermelho)
Primaria:   #2563eb (azul)
Texto:      #1f2937
Texto leve: #6b7280
```

---

## 4. Decisoes Tecnicas

### Decisao: Supabase JS Client via CDN

| Atributo | Valor |
|----------|-------|
| **Status** | Aceito |
| **Data** | 2026-04-10 |

**Escolha:** Usar `@supabase/supabase-js` via CDN (unpkg/esm.sh) ao inves de fetch puro.

**Justificativa:** O client simplifica queries, tratamento de erros e paginacao. Adiciona ~30KB mas elimina boilerplate de headers/auth manual.

**Alternativa Rejeitada:** Fetch puro — funcionaria, mas requer montar headers manualmente em cada request.

### Decisao: Calculo de Agregacoes no Frontend

| Atributo | Valor |
|----------|-------|
| **Status** | Aceito |
| **Data** | 2026-04-10 |

**Escolha:** Buscar lancamentos do mes e calcular totais/agrupamentos no JS.

**Justificativa:** Volume pequeno (dezenas de lancamentos/mes). Evita criar RPC/views no banco.

**Alternativa Rejeitada:** RPC no Supabase — complexidade desnecessaria para o volume de dados.

---

## 5. File Manifest

| # | Arquivo | Acao | Proposito | Dependencias |
|---|---------|------|-----------|--------------|
| 1 | `index.html` | Criar | App completa (HTML + CSS + JS) | Supabase CDN |

**Sim, e so 1 arquivo.** Toda a aplicacao cabe em um unico `index.html` com CSS no `<style>` e JS no `<script>`. Isso e intencional — maximo de simplicidade para deploy e manutencao.

---

## 6. Padroes de Codigo

### Estrutura do index.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Caixa do Dentista</title>
  <style>/* CSS mobile-first aqui */</style>
</head>
<body>
  <!-- Header -->
  <!-- Tabs -->
  <!-- Tab Lancamento: formulario -->
  <!-- Tab Extrato: lista + saldo -->
  <!-- Tab Resumo: tabela por categoria -->

  <script type="module">
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

    const supabase = createClient(
      'https://bjoctdjskejbqugxojmv.supabase.co',
      'ANON_KEY'
    )

    // Estado
    let currentTab = 'lancamento'
    let categorias = []
    let mesAtual = new Date().toISOString().slice(0, 7) // "2026-04"

    // Inicializacao
    async function init() {
      categorias = await loadCategorias()
      renderApp()
    }

    // CRUD
    async function loadCategorias() { /* ... */ }
    async function salvarLancamento(dados) { /* ... */ }
    async function loadLancamentos(mes) { /* ... */ }

    // Render
    function renderApp() { /* ... */ }
    function renderForm() { /* ... */ }
    function renderExtrato() { /* ... */ }
    function renderResumo() { /* ... */ }

    // Helpers
    function formatMoney(valor) { /* ... */ }
    function calcSaldo(lancamentos) { /* ... */ }
    function agruparPorCategoria(lancamentos) { /* ... */ }

    init()
  </script>
</body>
</html>
```

### Interacao com Supabase
```javascript
// Carregar categorias
async function loadCategorias() {
  const { data } = await supabase
    .from('categorias')
    .select('*')
    .order('nome')
  return data
}

// Salvar lancamento
async function salvarLancamento({ tipo, valor, categoria_id, descricao, data }) {
  const { error } = await supabase
    .from('lancamentos')
    .insert({ tipo, valor, categoria_id, descricao, data })
  if (error) throw error
}

// Buscar lancamentos do mes
async function loadLancamentos(mes) {
  const inicio = `${mes}-01`
  const fim = proximoMes(mes)
  const { data } = await supabase
    .from('lancamentos')
    .select('*, categorias(nome)')
    .gte('data', inicio)
    .lt('data', fim)
    .order('data', { ascending: false })
  return data
}
```

---

## 7. Configuracao Supabase

```
URL:  https://bjoctdjskejbqugxojmv.supabase.co
KEY:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb2N0ZGpza2VqYnF1Z3hvam12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDA2NDQsImV4cCI6MjA5MTQxNjY0NH0.x-xU4MdAg5pE6Ml9anPwwgpe-kl9xakjbHNaJS-vEvk
```

> Nota: A anon key e publica por design no Supabase. A seguranca e feita via RLS (que esta configurado como acesso publico, conforme requisito).

---

## 8. Estrategia de Teste

| Tipo | Escopo | Como |
|------|--------|------|
| Manual | Formulario de lancamento | Preencher e salvar, verificar no extrato |
| Manual | Filtro por mes | Criar lancamentos em meses diferentes, filtrar |
| Manual | Resumo | Verificar se totais por categoria estao corretos |
| Manual | Mobile | Abrir no celular, testar todas as telas |
| Banco | Dados | Verificar lancamentos via Supabase Dashboard |

> Para um MVP deste tamanho (1 arquivo, 3 telas), testes manuais sao suficientes. Testes automatizados seriam overengineering.

---

## 9. Deploy

### Opcao Recomendada: Abrir direto no navegador

Como e um unico arquivo HTML, a forma mais simples:
1. Abrir `index.html` no navegador
2. Funciona imediatamente (Supabase e acessado via API remota)

### Opcao Futura: Deploy em hosting estatico
- Vercel, Netlify, ou GitHub Pages (todos gratuitos)
- Basta fazer upload do `index.html`

---

## Proximo Passo

```
/build .claude/sdd/features/DESIGN_CAIXA_DENTISTA.md
```
