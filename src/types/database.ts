export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          codigo_empresa: string;
          cnpj: string;
          razao_social: string;
          nome_fantasia: string | null;
          regime_tributario: "lucro_real" | "lucro_presumido" | "simples_nacional";
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          codigo_empresa: string;
          cnpj: string;
          razao_social: string;
          nome_fantasia?: string | null;
          regime_tributario: "lucro_real" | "lucro_presumido" | "simples_nacional";
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          codigo_empresa?: string;
          cnpj?: string;
          razao_social?: string;
          nome_fantasia?: string | null;
          regime_tributario?: "lucro_real" | "lucro_presumido" | "simples_nacional";
          ativo?: boolean;
          atualizado_em?: string;
        };
      };
      empresa_periodicidade: {
        Row: {
          empresa_id: string;
          ano: number;
          periodicidade: "TRIMESTRAL" | "ANUAL";
        };
        Insert: {
          empresa_id: string;
          ano: number;
          periodicidade: "TRIMESTRAL" | "ANUAL";
        };
        Update: {
          periodicidade?: "TRIMESTRAL" | "ANUAL";
        };
      };
      usuarios_perfis: {
        Row: {
          usuario_id: string;
          perfil: "analista" | "consultoria" | "gestor" | "admin";
          nome_completo: string;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          usuario_id: string;
          perfil: "analista" | "consultoria" | "gestor" | "admin";
          nome_completo: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          perfil?: "analista" | "consultoria" | "gestor" | "admin";
          nome_completo?: string;
          ativo?: boolean;
          atualizado_em?: string;
        };
      };
      carteira_empresas: {
        Row: {
          usuario_id: string;
          empresa_id: string;
          papel: "analista" | "consultoria";
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          usuario_id: string;
          empresa_id: string;
          papel: "analista" | "consultoria";
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          papel?: "analista" | "consultoria";
          ativo?: boolean;
        };
      };
      fechamentos: {
        Row: {
          id: string;
          empresa_id: string;
          ano: number;
          periodo: "T1" | "T2" | "T3" | "T4" | "ANUAL";
          status: "zerado" | "em_analise" | "aprovado" | "reprovado" | "entregue" | "retificacao_pendente";
          origem: "webhook" | "manual";
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          ano: number;
          periodo: "T1" | "T2" | "T3" | "T4" | "ANUAL";
          status?: "zerado" | "em_analise" | "aprovado" | "reprovado" | "entregue" | "retificacao_pendente";
          origem?: "webhook" | "manual";
          criado_por?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          status?: "zerado" | "em_analise" | "aprovado" | "reprovado" | "entregue" | "retificacao_pendente";
          origem?: "webhook" | "manual";
          atualizado_em?: string;
        };
      };
      fechamento_versoes: {
        Row: {
          id: string;
          fechamento_id: string;
          numero_versao: number;
          bloqueada: boolean;
          valores: Json | null;
          storage_path_prefix: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          fechamento_id: string;
          numero_versao?: number;
          bloqueada?: boolean;
          valores?: Json | null;
          storage_path_prefix?: string | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        Update: {
          bloqueada?: boolean;
          valores?: Json | null;
          storage_path_prefix?: string | null;
        };
      };
      declaracoes: {
        Row: {
          id: string;
          empresa_id: string;
          ano: number;
          tipo_declaracao: "ECD" | "ECF";
          status: "pendente" | "zerado" | "em_analise" | "aprovado" | "transmitido" | "retificacao_pendente" | "retificada";
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          ano: number;
          tipo_declaracao: "ECD" | "ECF";
          status?: "pendente" | "zerado" | "em_analise" | "aprovado" | "transmitido" | "retificacao_pendente" | "retificada";
          criado_por?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          status?: "pendente" | "zerado" | "em_analise" | "aprovado" | "transmitido" | "retificacao_pendente" | "retificada";
          atualizado_em?: string;
        };
      };
      declaracao_versoes: {
        Row: {
          id: string;
          declaracao_id: string;
          numero_versao: number;
          bloqueada: boolean;
          hash_anterior: string | null;
          valores: Json | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          declaracao_id: string;
          numero_versao?: number;
          bloqueada?: boolean;
          hash_anterior?: string | null;
          valores?: Json | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        Update: {
          bloqueada?: boolean;
          hash_anterior?: string | null;
          valores?: Json | null;
        };
      };
      historico_status: {
        Row: {
          id: string;
          entidade_tipo: "fechamento" | "declaracao";
          entidade_id: string;
          status_anterior: string | null;
          status_novo: string;
          usuario_id: string | null;
          observacao: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          entidade_tipo: "fechamento" | "declaracao";
          entidade_id: string;
          status_anterior?: string | null;
          status_novo: string;
          usuario_id?: string | null;
          observacao?: string | null;
          criado_em?: string;
        };
        Update: Record<string, never>;
      };
      observacoes: {
        Row: {
          id: string;
          entidade_tipo: "fechamento" | "declaracao";
          entidade_id: string;
          conteudo: string;
          usuario_id: string;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          entidade_tipo: "fechamento" | "declaracao";
          entidade_id: string;
          conteudo: string;
          usuario_id: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          conteudo?: string;
          ativo?: boolean;
          atualizado_em?: string;
        };
      };
      anexos: {
        Row: {
          id: string;
          entidade_tipo: "fechamento" | "declaracao";
          entidade_id: string;
          tipo_documento: "DRE" | "BALANCO" | "DMPL" | "DFC" | "DRA" | "RECIBO_ECD" | "RECIBO_ECF";
          storage_path: string;
          nome_arquivo: string | null;
          tamanho_bytes: number | null;
          enviado_por: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          entidade_tipo: "fechamento" | "declaracao";
          entidade_id: string;
          tipo_documento: "DRE" | "BALANCO" | "DMPL" | "DFC" | "DRA" | "RECIBO_ECD" | "RECIBO_ECF";
          storage_path: string;
          nome_arquivo?: string | null;
          tamanho_bytes?: number | null;
          enviado_por?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          ativo?: boolean;
        };
      };
      execucoes_integracao: {
        Row: {
          id: string;
          tipo: string;
          chave_idempotencia: string;
          status: "sucesso" | "erro" | "duplicado" | "timeout" | "em_andamento";
          payload_recebido: Json | null;
          resultado: Json | null;
          origem: "webhook" | "manual";
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          tipo?: string;
          chave_idempotencia: string;
          status: "sucesso" | "erro" | "duplicado" | "timeout" | "em_andamento";
          payload_recebido?: Json | null;
          resultado?: Json | null;
          origem?: "webhook" | "manual";
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          status?: "sucesso" | "erro" | "duplicado" | "timeout" | "em_andamento";
          resultado?: Json | null;
          atualizado_em?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      usuario_tem_empresa: {
        Args: { p_empresa_id: string };
        Returns: boolean;
      };
      auth_perfil: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
