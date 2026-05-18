import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERFIL_LABEL: Record<string, string> = {
  analista: "Analista",
  consultoria: "Consultoria",
  gestor: "Gestor",
  admin: "Administrador",
};

export function TopBar() {
  const { user, perfil, signOut } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <span className="text-sm text-muted-foreground">
        {new Date().getFullYear()}
      </span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:block text-xs">
                {user?.email?.split("@")[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs font-medium">
                {perfil ? PERFIL_LABEL[perfil] : ""}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
