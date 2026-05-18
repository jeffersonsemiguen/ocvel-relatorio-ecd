import type { StatusFechamento, StatusDeclaracao } from "@/types/domain";

export const STATUS_FECHAMENTO_LABEL: Record<StatusFechamento, string> = {
  zerado: "Zerado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  entregue: "Entregue",
  retificacao_pendente: "Retificação pendente",
};

export const STATUS_FECHAMENTO_VARIANT: Record<
  StatusFechamento,
  "default" | "secondary" | "destructive" | "outline"
> = {
  zerado: "outline",
  em_analise: "secondary",
  aprovado: "default",
  reprovado: "destructive",
  entregue: "default",
  retificacao_pendente: "secondary",
};

export const STATUS_DECLARACAO_LABEL: Record<StatusDeclaracao, string> = {
  pendente: "Pendente",
  zerado: "Zerado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  transmitido: "Transmitido",
  retificacao_pendente: "Retificação pendente",
  retificada: "Retificada",
};

export const STATUS_DECLARACAO_VARIANT: Record<
  StatusDeclaracao,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendente: "outline",
  zerado: "outline",
  em_analise: "secondary",
  aprovado: "default",
  transmitido: "default",
  retificacao_pendente: "secondary",
  retificada: "secondary",
};

export const TRANSICOES_FECHAMENTO: Record<StatusFechamento, StatusFechamento[]> = {
  zerado: ["em_analise", "reprovado"],
  em_analise: ["aprovado", "reprovado"],
  aprovado: ["entregue", "reprovado"],
  reprovado: ["em_analise"],
  entregue: ["retificacao_pendente"],
  retificacao_pendente: ["em_analise"],
};

export const TRANSICOES_DECLARACAO: Record<StatusDeclaracao, StatusDeclaracao[]> = {
  pendente: ["zerado"],
  zerado: ["em_analise"],
  em_analise: ["aprovado", "zerado"],
  aprovado: ["transmitido", "em_analise"],
  transmitido: ["retificacao_pendente"],
  retificacao_pendente: ["retificada"],
  retificada: ["em_analise"],
};
