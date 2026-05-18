import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useSignedUrl() {
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage
        .from("anexos")
        .createSignedUrl(storagePath, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
