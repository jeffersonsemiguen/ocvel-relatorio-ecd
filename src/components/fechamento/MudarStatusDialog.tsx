import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  STATUS_FECHAMENTO_LABEL,
  TRANSICOES_FECHAMENTO,
} from "@/constants/status";
import { useUpdateStatus } from "@/hooks/useUpdateStatus";
import type { StatusFechamento } from "@/types/domain";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fechamentoId: string;
  statusAtual: StatusFechamento;
}

export function MudarStatusDialog({
  open,
  onOpenChange,
  fechamentoId,
  statusAtual,
}: Props) {
  const [statusNovo, setStatusNovo] = useState<StatusFechamento | "">("");
  const [observacao, setObservacao] = useState("");
  const { mutate, isPending } = useUpdateStatus();

  const opcoes = TRANSICOES_FECHAMENTO[statusAtual] ?? [];

  function handleConfirm() {
    if (!statusNovo) return;
    mutate(
      {
        entidadeTipo: "fechamento",
        entidadeId: fechamentoId,
        statusAnterior: statusAtual,
        statusNovo,
        observacao: observacao || undefined,
      },
      { onSuccess: () => { onOpenChange(false); setStatusNovo(""); setObservacao(""); } }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Novo status</Label>
            <Select value={statusNovo} onValueChange={(v) => setStatusNovo(v as StatusFechamento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_FECHAMENTO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da mudança de status..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!statusNovo || isPending}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
