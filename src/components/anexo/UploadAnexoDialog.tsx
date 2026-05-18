import { useRef, useState } from "react";
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
import { useUploadAnexo } from "@/hooks/useUploadAnexo";
import type { TipoDocumento } from "@/types/domain";

const TIPOS: { value: TipoDocumento; label: string }[] = [
  { value: "DRE", label: "DRE" },
  { value: "BALANCO", label: "Balanço" },
  { value: "DMPL", label: "DMPL" },
  { value: "DFC", label: "DFC" },
  { value: "DRA", label: "DRA" },
  { value: "RECIBO_ECD", label: "Recibo ECD" },
  { value: "RECIBO_ECF", label: "Recibo ECF" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
}

export function UploadAnexoDialog({ open, onOpenChange, entidadeTipo, entidadeId }: Props) {
  const [tipo, setTipo] = useState<TipoDocumento | "">("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUploadAnexo();

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !tipo) return;
    mutate(
      { entidadeTipo, entidadeId, tipoDocumento: tipo, file },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTipo("");
          if (fileRef.current) fileRef.current.value = "";
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar arquivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDocumento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Arquivo (PDF)</Label>
            <Input ref={fileRef} type="file" accept="application/pdf" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={!tipo || isPending}>Enviar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
