import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TutorGate } from "@/components/TutorGate";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Setup from "./pages/Setup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PetPublic from "./pages/PetPublic.tsx";
import MeusPets from "./pages/MeusPets.tsx";
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
import AdminSaasCenter from "./pages/AdminSaasCenter.tsx";
import AdminTags from "./pages/AdminTags.tsx";
import Veterinarios from "./pages/Veterinarios.tsx";
import VetLogin from "./pages/vet/VetLogin.tsx";
import VetDashboard from "./pages/vet/VetDashboard.tsx";
import VetPacientes from "./pages/vet/VetPacientes.tsx";
import VetProntuario from "./pages/vet/VetProntuario.tsx";
import VetAtendimentos from "./pages/vet/VetAtendimentos.tsx";
import VetExames from "./pages/vet/VetExames.tsx";
import VetVacinacao from "./pages/vet/VetVacinacao.tsx";
import VetPerfil from "./pages/vet/VetPerfil.tsx";
import VetProntuarios from "./pages/vet/VetProntuarios.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pet" element={<PetPublic />} />
          {/* Áreas do tutor: exigem sessão autenticada (Supabase Auth) + RLS no banco */}
          <Route path="/setup" element={<TutorGate><Setup /></TutorGate>} />
          <Route path="/dashboard" element={<TutorGate><Dashboard /></TutorGate>} />
          <Route path="/meus-pets" element={<TutorGate><MeusPets /></TutorGate>} />
          <Route path="/edit" element={<TutorGate><Edit /></TutorGate>} />
          <Route path="/vacinas" element={<TutorGate><Vacinas /></TutorGate>} />
          <Route path="/vermifugacao" element={<TutorGate><Vermifugacao /></TutorGate>} />
          <Route path="/saude" element={<TutorGate><Saude /></TutorGate>} />
          <Route path="/localizacoes" element={<TutorGate><Localizacoes /></TutorGate>} />
          <Route path="/assistente-ia" element={<TutorGate><AssistenteIA /></TutorGate>} />
          <Route path="/historico" element={<TutorGate><HistoricoInteligente /></TutorGate>} />
          <Route path="/veterinarios" element={<TutorGate><Veterinarios /></TutorGate>} />

          <Route path="/vet/login" element={<VetLogin />} />
          <Route path="/vet" element={<VetDashboard />} />
          <Route path="/vet/pacientes" element={<VetPacientes />} />
          <Route path="/vet/prontuario/:petId" element={<VetProntuario />} />
          <Route path="/vet/atendimentos" element={<VetAtendimentos />} />
          <Route path="/vet/exames" element={<VetExames />} />
          <Route path="/vet/vacinacao" element={<VetVacinacao />} />
          <Route path="/vet/prontuarios" element={<VetProntuarios />} />
          <Route path="/vet/perfil" element={<VetPerfil />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/pets" element={<AdminPets />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/tags" element={<AdminTags />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/perfil" element={<AdminPerfil />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
          <Route path="/admin/saas-center" element={<AdminSaasCenter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
