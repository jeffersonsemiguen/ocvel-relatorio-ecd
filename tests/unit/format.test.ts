import { describe, it, expect } from "vitest";
import { formatCNPJ, formatBRL, formatDataPt, formatPeriodo } from "@/lib/format";

describe("formatCNPJ", () => {
  it("formats 14-digit string", () => {
    expect(formatCNPJ("21975559000107")).toBe("21.975.559/0001-07");
  });
  it("returns original if already formatted", () => {
    expect(formatCNPJ("21.975.559/0001-07")).toBe("21.975.559/0001-07");
  });
});

describe("formatBRL", () => {
  it("formats number as BRL", () => {
    expect(formatBRL(1234.56)).toMatch(/1\.234,56/);
  });
  it("handles zero", () => {
    expect(formatBRL(0)).toMatch(/0,00/);
  });
});

describe("formatDataPt", () => {
  it("formats ISO date to PT-BR", () => {
    expect(formatDataPt("2025-06-15T12:00:00Z")).toMatch(/15\/06\/2025/);
  });
  it("returns dash for null", () => {
    expect(formatDataPt(null)).toBe("—");
  });
});

describe("formatPeriodo", () => {
  it("maps T1 to 1º Trimestre", () => {
    expect(formatPeriodo("T1")).toBe("1º Trimestre");
  });
  it("maps ANUAL to Anual", () => {
    expect(formatPeriodo("ANUAL")).toBe("Anual");
  });
});
