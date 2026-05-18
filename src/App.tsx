import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardFechamentosPage } from "@/pages/DashboardFechamentosPage";
import { DashboardDeclaracoesPage } from "@/pages/DashboardDeclaracoesPage";
import { FechamentoDetailPage } from "@/pages/FechamentoDetailPage";
import { DeclaracaoDetailPage } from "@/pages/DeclaracaoDetailPage";
import { CarteiraPage } from "@/pages/CarteiraPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/fechamentos" replace />} />
        <Route path="/fechamentos" element={<DashboardFechamentosPage />} />
        <Route path="/fechamentos/:id" element={<FechamentoDetailPage />} />
        <Route path="/declaracoes" element={<DashboardDeclaracoesPage />} />
        <Route path="/declaracoes/:id" element={<DeclaracaoDetailPage />} />
        <Route path="/carteira" element={<CarteiraPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
