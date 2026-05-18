import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/fechamentos", label: "Fechamentos", icon: LayoutDashboard },
  { to: "/declaracoes", label: "Declarações", icon: FileText },
  { to: "/carteira", label: "Carteira", icon: Briefcase },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r bg-card px-3 py-4 gap-1">
      <div className="mb-4 px-3 py-2">
        <span className="text-sm font-bold tracking-wide text-primary">OCVEL</span>
        <p className="text-xs text-muted-foreground">Painel ECD/ECF</p>
      </div>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
