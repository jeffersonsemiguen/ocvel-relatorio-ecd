import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIODOS, PERIODO_LABEL } from "@/constants/periodos";
import { useCriarFechamentoManual } from "@/hooks/useCriarFechamentoManual";
import type { Periodo } from "@/types/domain";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CriarFechamentoManualDialog({ open, onOpenChange }: Props) {
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [periodo, setPeriodo] = useState<Periodo | "">("");
  const { mutate, isPending } = useCriarFechamentoManual();

  function handleConfirm() {
    if (!codigoEmpresa || !periodo) return;
    mutate(
      { codigoEmpresa, ano, periodoCodigo: periodo },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCodigoEmpresa("");
          setPeriodo("");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar fechamento manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Código da empresa</Label>
            <Input
              value={codigoEmpresa}
              onChange={(e) => setCodigoEmpresa(e.target.value)}
              placeholder="Ex: BASSO"
            />
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <Input
              type="number"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              min={2020}
              max={2099}
            />
          </div>
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p} value={p}>{PERIODO_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!codigoEmpresa || !periodo || isPending}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
