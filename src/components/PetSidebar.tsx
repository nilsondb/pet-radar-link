import { Pencil, Siren, LogOut, X, Syringe, Bug, HeartPulse, MapPin, Bot, Brain, Home, Dog } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  token?: string | null;
  open: boolean;
  onClose: () => void;
}

export const PetSidebar = ({ id, token, open, onClose }: Props) => {
  const navigate = useNavigate();
  const qs = token ? `?id=${id}&token=${token}` : `?id=${id}`;

  const items = [
    { to: `/dashboard${qs}`, label: "Dashboard", icon: Home },
    { to: `/meus-pets${qs}`, label: "Meus Pets", icon: Dog },
    { to: `/edit${qs}`, label: "Editar Pet", icon: Pencil },
    { to: `/vacinas${qs}`, label: "Vacinação", icon: Syringe },
    { to: `/vermifugacao${qs}`, label: "Vermifugação", icon: Bug },
    { to: `/saude${qs}`, label: "Saúde do Pet", icon: HeartPulse },
    { to: `/localizacoes${qs}`, label: "Localizações", icon: MapPin },
    { to: `/veterinarios${qs}`, label: "Veterinários", icon: Stethoscope },
    { to: `/historico${qs}`, label: "Histórico Inteligente", icon: Brain },
    { to: `/assistente-ia${qs}`, label: "Assistente IA", icon: Bot },
  ];

  const handleLogout = () => {
    onClose();
    navigate(`/setup?id=${id}`);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-sidebar z-50 shadow-2xl transform transition-transform duration-300 overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="header-gradient text-primary-foreground p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Authera Pet</h2>
            <p className="text-xs opacity-80">Tag #{id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar menu">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-muted"
                )
              }
            >
              <it.icon className="w-5 h-5" />
              {it.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </nav>
      </aside>
    </>
  );
};
