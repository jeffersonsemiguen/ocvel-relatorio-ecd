import type { Database } from "./database";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type EmpresaPeriodicidade =
  Database["public"]["Tables"]["empresa_periodicidade"]["Row"];
export type UsuarioPerfil = Database["public"]["Tables"]["usuarios_perfis"]["Row"];
export type CarteiraEmpresa =
  Database["public"]["Tables"]["carteira_empresas"]["Row"];
export type Fechamento = Database["public"]["Tables"]["fechamentos"]["Row"];
export type FechamentoVersao =
  Database["public"]["Tables"]["fechamento_versoes"]["Row"];
export type Declaracao = Database["public"]["Tables"]["declaracoes"]["Row"];
export type DeclaracaoVersao =
  Database["public"]["Tables"]["declaracao_versoes"]["Row"];
export type HistoricoStatus = Database["public"]["Tables"]["historico_status"]["Row"];
export type Observacao = Database["public"]["Tables"]["observacoes"]["Row"];
export type Anexo = Database["public"]["Tables"]["anexos"]["Row"];
export type ExecucaoIntegracao =
  Database["public"]["Tables"]["execucoes_integracao"]["Row"];

export type Perfil = "analista" | "consultoria" | "gestor" | "admin";
export type Periodo = "T1" | "T2" | "T3" | "T4" | "ANUAL";
export type Periodicidade = "ANUAL" | "TRIMESTRAL";
export type TipoDeclaracao = "ECD" | "ECF";

export type StatusFechamento =
  | "zerado"
  | "em_analise"
  | "aprovado"
  | "reprovado"
  | "entregue"
  | "retificacao_pendente";

export type StatusDeclaracao =
  | "pendente"
  | "zerado"
  | "em_analise"
  | "aprovado"
  | "transmitido"
  | "retificacao_pendente"
  | "retificada";

export type TipoDocumento =
  | "DRE"
  | "BALANCO"
  | "DMPL"
  | "DFC"
  | "DRA"
  | "RECIBO_ECD"
  | "RECIBO_ECF";

export interface FechamentoComEmpresa extends Fechamento {
  empresa: Pick<Empresa, "id" | "codigo_empresa" | "razao_social" | "cnpj">;
}

export interface FechamentoComVersoes extends Fechamento {
  empresa: Pick<Empresa, "id" | "codigo_empresa" | "razao_social" | "cnpj">;
  versoes: FechamentoVersao[];
}

export interface DeclaracaoComEmpresa extends Declaracao {
  empresa: Pick<Empresa, "id" | "codigo_empresa" | "razao_social" | "cnpj">;
}
