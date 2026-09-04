import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { TutorGate } from "@/components/TutorGate";
import { AdminGate } from "@/components/AdminGate";
import { VetGate } from "@/components/VetGate";

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
import Veterinarios from "./pages/Veterinarios.tsx";

import Admin from "./pages/Admin.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminPets from "./pages/AdminPets.tsx";
import AdminUsuarios from "./pages/AdminUsuarios.tsx";
import AdminTags from "./pages/AdminTags.tsx";
import AdminFinanceiro from "./pages/AdminFinanceiro.tsx";
import AdminPerfil from "./pages/AdminPerfil.tsx";
import AdminConfiguracoes from "./pages/AdminConfiguracoes.tsx";
import AdminSaasCenter from "./pages/AdminSaasCenter.tsx";

import VetLogin from "./pages/vet/VetLogin.tsx";
import VetDashboard from "./pages/vet/VetDashboard.tsx";
import VetPacientes from "./pages/vet/VetPacientes.tsx";
import VetProntuario from "./pages/vet/VetProntuario.tsx";
import VetProntuarios from "./pages/vet/VetProntuarios.tsx";
import VetAtendimentos from "./pages/vet/VetAtendimentos.tsx";
import VetExames from "./pages/vet/VetExames.tsx";
import VetVacinacao from "./pages/vet/VetVacinacao.tsx";
import VetPerfil from "./pages/vet/VetPerfil.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          {/* ==================================================
              ÁREA PÚBLICA
          ================================================== */}

          <Route path="/" element={<Index />} />
          <Route path="/pet" element={<PetPublic />} />

          {/* ==================================================
              TUTOR
              Supabase Auth + TutorGate + RLS
          ================================================== */}

          <Route
            path="/setup"
            element={
              <TutorGate>
                <Setup />
              </TutorGate>
            }
          />

          <Route
            path="/dashboard"
            element={
              <TutorGate>
                <Dashboard />
              </TutorGate>
            }
          />

          <Route
            path="/meus-pets"
            element={
              <TutorGate>
                <MeusPets />
              </TutorGate>
            }
          />

          <Route
            path="/edit"
            element={
              <TutorGate>
                <Edit />
              </TutorGate>
            }
          />

          <Route
            path="/vacinas"
            element={
              <TutorGate>
                <Vacinas />
              </TutorGate>
            }
          />

          <Route
            path="/vermifugacao"
            element={
              <TutorGate>
                <Vermifugacao />
              </TutorGate>
            }
          />

          <Route
            path="/saude"
            element={
              <TutorGate>
                <Saude />
              </TutorGate>
            }
          />

          <Route
            path="/localizacoes"
            element={
              <TutorGate>
                <Localizacoes />
              </TutorGate>
            }
          />

          <Route
            path="/assistente-ia"
            element={
              <TutorGate>
                <AssistenteIA />
              </TutorGate>
            }
          />

          <Route
            path="/historico"
            element={
              <TutorGate>
                <HistoricoInteligente />
              </TutorGate>
            }
          />

          {/*
            Mantida por compatibilidade.
            Não aparece mais como item principal da sidebar do Tutor.
          */}
          <Route
            path="/veterinarios"
            element={
              <TutorGate>
                <Veterinarios />
              </TutorGate>
            }
          />

          {/* ==================================================
              VETERINÁRIO
              Login público; demais rotas protegidas por VetGate
          ================================================== */}

          <Route path="/vet/login" element={<VetLogin />} />

          <Route
            path="/vet"
            element={
              <VetGate>
                <VetDashboard />
              </VetGate>
            }
          />

          <Route
            path="/vet/pacientes"
            element={
              <VetGate>
                <VetPacientes />
              </VetGate>
            }
          />

          <Route
            path="/vet/prontuario/:petId"
            element={
              <VetGate>
                <VetProntuario />
              </VetGate>
            }
          />

          <Route
            path="/vet/prontuarios"
            element={
              <VetGate>
                <VetProntuarios />
              </VetGate>
            }
          />

          <Route
            path="/vet/atendimentos"
            element={
              <VetGate>
                <VetAtendimentos />
              </VetGate>
            }
          />

          <Route
            path="/vet/exames"
            element={
              <VetGate>
                <VetExames />
              </VetGate>
            }
          />

          <Route
            path="/vet/vacinacao"
            element={
              <VetGate>
                <VetVacinacao />
              </VetGate>
            }
          />

          <Route
            path="/vet/perfil"
            element={
              <VetGate>
                <VetPerfil />
              </VetGate>
            }
          />

          {/* ==================================================
              ADMINISTRADOR
              Login público; demais rotas protegidas por AdminGate
          ================================================== */}

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin"
            element={
              <AdminGate>
                <Admin />
              </AdminGate>
            }
          />

          <Route
            path="/admin/pets"
            element={
              <AdminGate>
                <AdminPets />
              </AdminGate>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <AdminGate>
                <AdminUsuarios />
              </AdminGate>
            }
          />

          <Route
            path="/admin/tags"
            element={
              <AdminGate>
                <AdminTags />
              </AdminGate>
            }
          />

          <Route
            path="/admin/financeiro"
            element={
              <AdminGate>
                <AdminFinanceiro />
              </AdminGate>
            }
          />

          <Route
            path="/admin/perfil"
            element={
              <AdminGate>
                <AdminPerfil />
              </AdminGate>
            }
          />

          <Route
            path="/admin/configuracoes"
            element={
              <AdminGate>
                <AdminConfiguracoes />
              </AdminGate>
            }
          />

          <Route
            path="/admin/saas-center"
            element={
              <AdminGate>
                <AdminSaasCenter />
              </AdminGate>
            }
          />

          {/* Catch-all sempre por último */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
