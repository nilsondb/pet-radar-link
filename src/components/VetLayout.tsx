import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { loadVetSession, vetLogout, VetSession } from "@/lib/vetAuth";
import {
  LayoutDashboard, Dog, Stethoscope, FlaskConical, Syringe, FileText,
  UserCircle, LogOut, Menu, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/vet", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vet/pacientes", label: "Pacientes", icon: Dog },
  { to: "/vet/atendimentos", label: "Atendimentos", icon: Stethoscope },
  { to: "/vet/exames", label: "Exames", icon: FlaskConical },
  { to: "/vet/vacinacao", label: "Vacinação", icon: Syringe },
  { to: "/vet/prontuarios", label: "Prontuários", icon: FileText },
  { to: "/vet/perfil", label: "Perfil profissional", icon: UserCircle },
];

export const VetLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<VetSession | null>(null);
  const [checando, setChecando] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      // Sessão oficial do Supabase Auth + perfil profissional validado no banco
      const s = await loadVetSession();
      if (!s) {
        navigate("/vet/login", { replace: true });
        return;
      }
      setSession(s);
      setChecando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checando || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sair = async () => {
    setSession(null);
    await vetLogout();
    navigate("/", { replace: true });
  };


  return (
    <div className="min-h-screen flex bg-secondary">
      {open && (
        <div className="fixed inset-0 bg-foreground/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed md:static top-0 left-0 h-full md:h-auto w-64 bg-card border-r flex flex-col z-50 transition-transform",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary">Authera Pet Pro</h1>
            <p className="text-xs text-muted-foreground truncate">{session.nome}</p>
            {session.crmv && <p className="text-xs text-muted-foreground">CRMV {session.crmv}</p>}
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                )
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
          <button
            onClick={sair}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b px-4 md:px-6 py-4 flex items-center gap-3">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">{title}</h2>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};
