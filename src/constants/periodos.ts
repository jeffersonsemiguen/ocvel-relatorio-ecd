import type { Periodo } from "@/types/domain";

export const PERIODOS: Periodo[] = ["T1", "T2", "T3", "T4", "ANUAL"];

export const PERIODO_LABEL: Record<Periodo, string> = {
  T1: "1º Trim",
  T2: "2º Trim",
  T3: "3º Trim",
  T4: "4º Trim",
  ANUAL: "Anual",
};

export const PERIODOS_TRIMESTRAIS: Periodo[] = ["T1", "T2", "T3", "T4", "ANUAL"];
export const PERIODOS_ANUAIS: Periodo[] = ["ANUAL"];
