import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FechamentosTable } from "@/components/fechamento/FechamentosTable";
import { CriarFechamentoManualDialog } from "@/components/fechamento/CriarFechamentoManualDialog";
import { PERIODOS, PERIODO_LABEL } from "@/constants/periodos";
import { STATUS_FECHAMENTO_LABEL } from "@/constants/status";
import type { Periodo, StatusFechamento } from "@/types/domain";

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function DashboardFechamentosPage() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [periodo, setPeriodo] = useState<Periodo | "todos">("todos");
  const [status, setStatus] = useState<StatusFechamento | "todos">("todos");
  const [criarOpen, setCriarOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fechamentos</h1>
        <Button size="sm" onClick={() => setCriarOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Manual
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANOS.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo | "todos")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os períodos</SelectItem>
            {PERIODOS.map((p) => (
              <SelectItem key={p} value={p}>{PERIODO_LABEL[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v as StatusFechamento | "todos")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_FECHAMENTO_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FechamentosTable
        ano={ano}
        periodo={periodo !== "todos" ? periodo : undefined}
        status={status !== "todos" ? status : undefined}
      />

      <CriarFechamentoManualDialog open={criarOpen} onOpenChange={setCriarOpen} />
    </div>
  );
}
