import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Setup from "./pages/Setup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PetPublic from "./pages/PetPublic.tsx";
import Edit from "./pages/Edit.tsx";
import Vacinas from "./pages/Vacinas.tsx";
import Vermifugacao from "./pages/Vermifugacao.tsx";
import Saude from "./pages/Saude.tsx";
import Localizacoes from "./pages/Localizacoes.tsx";
import AssistenteIA from "./pages/AssistenteIA.tsx";
import HistoricoInteligente from "./pages/HistoricoInteligente.tsx";
import Admin from "./pages/Admin.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminPets from "./pages/AdminPets.tsx";
import AdminUsuarios from "./pages/AdminUsuarios.tsx";
import AdminFinanceiro from "./pages/AdminFinanceiro.tsx";
import AdminPerfil from "./pages/AdminPerfil.tsx";
import AdminConfiguracoes from "./pages/AdminConfiguracoes.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pet" element={<PetPublic />} />
          <Route path="/edit" element={<Edit />} />
          <Route path="/vacinas" element={<Vacinas />} />
          <Route path="/vermifugacao" element={<Vermifugacao />} />
          <Route path="/saude" element={<Saude />} />
          <Route path="/localizacoes" element={<Localizacoes />} />
          <Route path="/assistente-ia" element={<AssistenteIA />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/pets" element={<AdminPets />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/perfil" element={<AdminPerfil />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
