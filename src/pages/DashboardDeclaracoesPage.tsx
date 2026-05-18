import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeclaracoesTable } from "@/components/declaracao/DeclaracoesTable";
import type { TipoDeclaracao } from "@/types/domain";

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function DashboardDeclaracoesPage() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoDeclaracao | "todos">("todos");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Declarações ECD/ECF</h1>

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

        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDeclaracao | "todos")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">ECD e ECF</SelectItem>
            <SelectItem value="ECD">Apenas ECD</SelectItem>
            <SelectItem value="ECF">Apenas ECF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DeclaracoesTable
        ano={ano}
        tipo={tipo !== "todos" ? tipo : undefined}
      />
    </div>
  );
}
