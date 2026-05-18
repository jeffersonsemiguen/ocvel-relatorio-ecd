import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { signIn, signInWithMagicLink } = useAuth();
  const [magicSent, setMagicSent] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    try {
      await signIn(data.email, data.password);
    } catch (err) {
      toast.error("E-mail ou senha incorretos.");
    }
  }

  async function onMagicLink() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Informe o e-mail para o link mágico" });
      return;
    }
    try {
      await signInWithMagicLink(email);
      setMagicSent(true);
      toast.success("Link de acesso enviado para seu e-mail.");
    } catch {
      toast.error("Erro ao enviar link mágico.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Entrar
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onMagicLink}
          disabled={magicSent}
        >
          {magicSent ? "Link enviado!" : "Entrar com link mágico"}
        </Button>
      </form>
    </Form>
  );
}
