# ECD — Escrituracao Contabil Digital Knowledge Base

> **Purpose**: Referencia completa sobre ECD SPED: legislacao, estrutura tecnica, geracao e transmissao
> **MCP Validated**: 2026-05-04

## Quick Navigation

### Concepts (< 150 lines each)

| File | Purpose |
|------|---------|
| [concepts/o-que-e-ecd.md](concepts/o-que-e-ecd.md) | O que e ECD, historia, base legal, IN RFB 1.863/2018 |
| [concepts/obrigatoriedade.md](concepts/obrigatoriedade.md) | Quem e obrigado, dispensas, excecoes, prazos de entrega |
| [concepts/estrutura-arquivo.md](concepts/estrutura-arquivo.md) | Estrutura do arquivo: blocos, registros, campos, delimitadores |
| [concepts/blocos-registros.md](concepts/blocos-registros.md) | Todos os blocos (0, I, J, K, 9) e seus principais registros |
| [concepts/plano-contas.md](concepts/plano-contas.md) | Plano de Contas Referencial RFB (PCRFB), mapeamento I051 |
| [concepts/leiaute-versoes.md](concepts/leiaute-versoes.md) | Versoes do leiaute ECD (v8, v9, v10), compatibilidade PGE |
| [concepts/certificado-digital.md](concepts/certificado-digital.md) | Assinatura digital A1/A3, responsaveis, configuracao PGE |
| [concepts/transmissao.md](concepts/transmissao.md) | Transmissao pelo PGE, erros comuns, recibo de entrega |

### Patterns (< 200 lines each)

| File | Purpose |
|------|---------|
| [patterns/geracao-arquivo-ecd.md](patterns/geracao-arquivo-ecd.md) | Fluxo completo para geracao do arquivo ECD |
| [patterns/validacao-inconsistencias.md](patterns/validacao-inconsistencias.md) | Validacao, inconsistencias comuns e como corrigir |
| [patterns/bloco-0-identificacao.md](patterns/bloco-0-identificacao.md) | Montagem do Bloco 0: 0000, 0001, 0007, 0035, 0150, 0990 |
| [patterns/bloco-i-lancamentos.md](patterns/bloco-i-lancamentos.md) | Bloco I: plano de contas, lancamentos, saldos, PCRFB |
| [patterns/bloco-j-demonstracoes.md](patterns/bloco-j-demonstracoes.md) | Bloco J: BP, DRE, DMPL, notas explicativas |
| [patterns/bloco-k-cosif.md](patterns/bloco-k-cosif.md) | Bloco K: COSIF para instituicoes financeiras |
| [patterns/substituicao-retificacao.md](patterns/substituicao-retificacao.md) | Como retificar ECD entregue, hash anterior, prazo |
| [patterns/faq-perguntas-respostas.md](patterns/faq-perguntas-respostas.md) | 22 perguntas e respostas completas sobre ECD |

---

## Quick Reference

- [quick-reference.md](quick-reference.md) — Prazos, codigos, erros do PGE, checklist

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **ECD** | Escrituracao Contabil Digital — livros contabeis em formato digital SPED |
| **PGE** | Programa Gerador de Escrituracao — software RFB para validar e transmitir |
| **PCRFB** | Plano de Contas Referencial RFB — padrao para mapeamento do I051 |
| **COSIF** | Plano contabil das instituicoes financeiras (Bloco K) |
| **I051** | Registro de mapeamento conta propria -> conta referencial |
| **COD_HASH_ANT** | Hash SHA-1 da ECD anterior, obrigatorio em retificacoes |
| **IN RFB 1.863/2018** | Instrucao Normativa que consolida as regras da ECD |

---

## Learning Path

| Level | Files |
|-------|-------|
| **Iniciante** | concepts/o-que-e-ecd.md, concepts/obrigatoriedade.md, quick-reference.md |
| **Intermediario** | concepts/estrutura-arquivo.md, concepts/blocos-registros.md, patterns/geracao-arquivo-ecd.md |
| **Avancado** | patterns/bloco-i-lancamentos.md, patterns/bloco-j-demonstracoes.md, patterns/validacao-inconsistencias.md |
| **Especifico** | concepts/certificado-digital.md, patterns/substituicao-retificacao.md, patterns/bloco-k-cosif.md |

---

## Agent Usage

| Agent | Primary Files | Use Case |
|-------|---------------|----------|
| Desenvolvimento | patterns/geracao-arquivo-ecd.md, patterns/bloco-i-lancamentos.md | Implementar exportacao ECD |
| Validacao | patterns/validacao-inconsistencias.md, concepts/estrutura-arquivo.md | Verificar arquivo antes de transmitir |
| Fiscal/Contabil | concepts/obrigatoriedade.md, patterns/faq-perguntas-respostas.md | Esclarecer obrigacoes e prazos |
| Operacional | concepts/transmissao.md, patterns/substituicao-retificacao.md | Transmitir e retificar ECD |
