import { Dog, Pencil, Siren, LogOut, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  open: boolean;
  onClose: () => void;
}

export const PetSidebar = ({ id, open, onClose }: Props) => {
  const navigate = useNavigate();

  const items = [
    { to: `/pet?id=${id}`, label: "Meu Pet", icon: Dog },
    { to: `/edit?id=${id}`, label: "Editar Cadastro", icon: Pencil },
    { to: `/dashboard?id=${id}`, label: "Status do Pet", icon: Siren },
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
          "fixed top-0 left-0 h-full w-72 bg-sidebar z-50 shadow-2xl transform transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="header-gradient text-primary-foreground p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Pet_ID</h2>
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
