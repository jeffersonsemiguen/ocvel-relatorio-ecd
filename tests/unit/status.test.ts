import { describe, it, expect } from "vitest";
import {
  STATUS_FECHAMENTO_LABEL,
  STATUS_DECLARACAO_LABEL,
  TRANSICOES_FECHAMENTO,
  TRANSICOES_DECLARACAO,
} from "@/constants/status";

describe("STATUS_FECHAMENTO_LABEL", () => {
  it("has label for all fechamento statuses", () => {
    const statuses = ["zerado", "em_analise", "aprovado", "reprovado", "entregue", "retificacao_pendente"];
    for (const s of statuses) {
      expect(STATUS_FECHAMENTO_LABEL[s as keyof typeof STATUS_FECHAMENTO_LABEL]).toBeTruthy();
    }
  });
});

describe("STATUS_DECLARACAO_LABEL", () => {
  it("has label for all declaracao statuses", () => {
    const statuses = ["pendente", "zerado", "em_analise", "aprovado", "transmitido", "retificacao_pendente", "retificada"];
    for (const s of statuses) {
      expect(STATUS_DECLARACAO_LABEL[s as keyof typeof STATUS_DECLARACAO_LABEL]).toBeTruthy();
    }
  });
});

describe("TRANSICOES_FECHAMENTO", () => {
  it("zerado can go to em_analise", () => {
    expect(TRANSICOES_FECHAMENTO.zerado).toContain("em_analise");
  });
  it("entregue can only go to retificacao_pendente", () => {
    expect(TRANSICOES_FECHAMENTO.entregue).toEqual(["retificacao_pendente"]);
  });
});

describe("TRANSICOES_DECLARACAO", () => {
  it("transmitido can go to retificacao_pendente", () => {
    expect(TRANSICOES_DECLARACAO.transmitido).toContain("retificacao_pendente");
  });
});
