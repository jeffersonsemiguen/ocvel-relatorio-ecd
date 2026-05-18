# ECD Quick Reference

> Fast lookup tables. For code examples, see linked files.

## Prazos de Entrega

| Ano-Calendario | Prazo (ultimo dia util) | Situacao |
|---|---|---|
| 2023 | Junho/2024 | Encerrado |
| 2024 | Junho/2025 | Encerrado |
| 2025 | Junho/2026 | Vigente |
| Evento especial | Mes seguinte ao evento | Fusao/Cisao/Extincao |

## Blocos e Registros Principais

| Bloco | Finalidade | Registros Chave |
|---|---|---|
| 0 | Identificacao da empresa | 0000, 0001, 0007, 0150, 0990 |
| I | Lancamentos (Diario/Razao) | I010, I050, I051, I200, I250, I350 |
| J | Demonstracoes (BP/DRE) | J005, J100, J150, J801, J990 |
| K | COSIF (financeiras) | K030, K100, K110, K990 |
| 9 | Controle/Encerramento | 9900, 9990, 9999 |

## Codigos de Regime Tributario (J005.COD_INC_TRIB)

| Codigo | Regime |
|---|---|
| 01 | Imune ou Isenta |
| 02 | Lucro Real |
| 03 | Lucro Presumido |
| 04 | Lucro Arbitrado |
| 05 | Nao sujeita IRPJ |
| 06 | SCP |

## Erros Comuns no PGE

| Codigo | Causa | Solucao Rapida |
|---|---|---|
| E0001 | Campo obrigatorio vazio no 0000 | Preencher todos os campos do 0000 |
| E0050 | CNPJ invalido | Verificar 14 digitos sem mascara |
| E0201 | Conta analitica sem I051 | Criar I051 para cada IND_CTA=A |
| E0400 | Lancamento nao fecha D!=C | Conferir I250 filhos do I200 |
| E0500 | Qtd de registros errada no 9900 | Recontar registros por tipo |
| E0600 | Hash anterior invalido | Copiar SHA-1 exato do recibo |
| E0700 | Certificado invalido/expirado | Renovar certificado ICP-Brasil |

## Checklist Pre-Envio

| Item | Verificar |
|---|---|
| Encoding | UTF-8 sem BOM |
| Separador | Pipe `\|` em toda linha |
| Datas | Formato DDMMAAAA (8 digitos) |
| Valores | Virgula decimal, sem milhar |
| I051 | Toda conta analitica mapeada |
| Lancamentos | Debitos = Creditos por I200 |
| Balanco | Ativo = Passivo + PL no J100 |
| 9900 | Qtd exata por tipo de registro |
| Assinaturas | Contabilista + Representante legal |
| Recibo | Guardar .rec apos transmissao |

## Decision Matrix

| Use Case | Choose |
|---|---|
| Empresa Lucro Real | ECD obrigatoria (sempre) |
| Lucro Presumido distribuindo lucro isento | ECD obrigatoria |
| Simples Nacional qualquer porte | Dispensada |
| Empresa totalmente inativa | Dispensada |
| Retificar ECD entregue | Preencher COD_HASH_ANT e retransmitir |
| Instituicao financeira | Bloco K com dados (K001 IND_MOV=0) |
| Empresa nao financeira | Bloco K sem dados (K001 IND_MOV=1) |

## Common Pitfalls

| Don't | Do |
|---|---|
| Usar data com barras (01/01/2024) | Usar DDMMAAAA sem separador (01012024) |
| Omitir I051 para contas sinteticas | I051 somente para IND_CTA=A (analiticas) |
| Assinar com so 1 certificado | Assinar com contabilista E representante legal |
| Descartar o recibo .rec | Guardar .rec — hash necessario p/ retificacao |
| Confundir ECD com ECF | ECD=livros contabeis; ECF=IRPJ/CSLL |

## Links Oficiais

| Recurso | URL |
|---|---|
| Portal SPED / ECD | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/sped |
| e-CAC | https://cav.receita.fazenda.gov.br |

## Related Documentation

| Topic | Path |
|---|---|
| O Que e ECD | `concepts/o-que-e-ecd.md` |
| Obrigatoriedade | `concepts/obrigatoriedade.md` |
| Estrutura Arquivo | `concepts/estrutura-arquivo.md` |
| Geracao Arquivo | `patterns/geracao-arquivo-ecd.md` |
| Full Index | `index.md` |
