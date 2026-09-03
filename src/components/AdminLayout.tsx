import { ReactNode, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { adminLogout, getAdminSession } from "@/lib/adminAuth";
import { LayoutDashboard, Dog, Users, DollarSign, Settings, LogOut, UserCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pets", label: "Pets", icon: Dog },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/admin/saas-center", label: "SaaS Center", icon: Activity },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { to: "/admin/perfil", label: "Perfil", icon: UserCircle },
];

export const AdminLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const navigate = useNavigate();
  const session = getAdminSession();

  useEffect(() => {
    if (!session) navigate("/admin/login", { replace: true });
  }, [session, navigate]);

  const sair = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex bg-secondary">
      <aside className="w-60 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-primary">Authera Pet 🐾</h1>
          <p className="text-xs text-muted-foreground truncate">{session.nome || session.email}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
          <button
            onClick={sair}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b px-6 py-4">
          <h2 className="text-xl font-bold">{title}</h2>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
