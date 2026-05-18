import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { TipoDocumento } from "@/types/domain";

interface Params {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
  tipoDocumento: TipoDocumento;
  file: File;
}

export function useUploadAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entidadeTipo, entidadeId, tipoDocumento, file }: Params) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const ext = file.name.split(".").pop();
      const storagePath = `${entidadeTipo}/${entidadeId}/${tipoDocumento}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("anexos")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("anexos").insert({
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        tipo_documento: tipoDocumento,
        storage_path: storagePath,
        nome_arquivo: file.name,
        tamanho_bytes: file.size,
        enviado_por: user.id,
      });

      if (insertError) {
        await supabase.storage.from("anexos").remove([storagePath]);
        throw insertError;
      }
    },
    onSuccess: (_data, { entidadeTipo, entidadeId }) => {
      queryClient.invalidateQueries({
        queryKey: ["anexos", entidadeTipo, entidadeId],
      });
      toast.success("Arquivo enviado com sucesso.");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao enviar arquivo: ${err.message}`);
    },
  });
}
