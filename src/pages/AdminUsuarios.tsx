import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { concederPapel, revogarPapel } from "@/lib/adminAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, ShieldOff, ShieldCheck } from "lucide-react";

type Usuario = {
  chave: string;
  user_id: string | null;
  email: string | null;
  nome: string | null;
  papeis: string[];
  status: string;
  conta_vinculada: boolean;
  criado_em: string;
  tutor_id: string | null;
  veterinario_id: string | null;
  crmv: string | null;
  uf_crmv: string | null;
  clinica: string | null;
  status_profissional: string | null;
  admin_ativo: boolean | null;
  pets_count: number;
  pacientes_count: number;
  tags_count: number;
};

const abas = [
  { id: "todos", label: "Todos" },
  { id: "tutor", label: "Tutores" },
  { id: "veterinarian", label: "Veterinários" },
  { id: "admin", label: "Administradores" },
  { id: "pendentes", label: "Pendentes" },
  { id: "inativos", label: "Inativos" },
] as const;

const papelLabel: Record<string, string> = {
  tutor: "Tutor",
  veterinarian: "Veterinário",
  admin: "Administrador",
};

const papelClass: Record<string, string> = {
  tutor: "bg-primary/15 text-primary",
  veterinarian: "bg-accent text-accent-foreground",
  admin: "bg-success/15 text-success",
};

const AdminUsuarios = () => {
  const [lista, setLista] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [novo, setNovo] = useState({ email: "" });
  const [detalhe, setDetalhe] = useState<Usuario | null>(null);

  const load = async () => {
    setLoading(true);
    // Visão consolidada vinda do servidor: os papéis oficiais são os de user_roles.
    const { data, error } = await supabase.rpc("admin_listar_usuarios");
    if (error) toast.error(error.message);
    setLista(((data as Usuario[]) || []).slice().sort((a, b) => b.criado_em.localeCompare(a.criado_em)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const criar = async () => {
    try {
      await concederPapel(novo.email, "admin");
      toast.success("Acesso administrativo concedido");
      setOpenNew(false);
      setNovo({ email: "" });
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const alternarPapel = async (u: Usuario, papel: "admin" | "veterinarian" | "tutor", conceder: boolean) => {
    if (!u.email) return toast.error("Usuário sem e-mail vinculado.");
    try {
      if (conceder) await concederPapel(u.email, papel);
      else await revogarPapel(u.email, papel);
      toast.success(conceder ? "Papel concedido" : "Papel revogado");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const totais = useMemo(() => ({
    total: lista.length,
    tutores: lista.filter((u) => u.papeis.includes("tutor")).length,
    vets: lista.filter((u) => u.papeis.includes("veterinarian")).length,
    admins: lista.filter((u) => u.papeis.includes("admin")).length,
  }), [lista]);

  const filtrados = lista.filter((u) => {
    const q = busca.trim().toLowerCase();
    const okBusca = !q || (u.nome || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    const okAba =
      aba === "todos" ||
      (aba === "pendentes" && u.status === "pendente") ||
      (aba === "inativos" && u.status === "inativo") ||
      u.papeis.includes(aba);
    return okBusca && okAba;
  });

  return (
    <AdminLayout title="Usuários">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total de usuários", valor: totais.total },
          { label: "Tutores", valor: totais.tutores },
          { label: "Veterinários", valor: totais.vets },
          { label: "Administradores", valor: totais.admins },
        ].map((c) => (
          <div key={c.label} className="bg-card border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              aba === a.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Conceder admin</Button></DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Conceder acesso administrativo</DialogTitle>
              <DialogDescription>
                O acesso é concedido a contas já existentes no login. A pessoa cria a conta primeiro
                e recebe o papel aqui — nenhuma conta nova é criada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>E-mail da conta</Label>
              <Input type="email" value={novo.email} onChange={(e) => setNovo({ email: e.target.value })} />
              <Button className="w-full" onClick={criar}>Conceder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {["Nome", "E-mail", "Perfil/Papéis", "Status", "Conta vinculada", "Cadastro", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrados.map((u) => (
                <tr key={u.chave}>
                  <td className="px-4 py-3">
                    <button className="font-medium hover:underline" onClick={() => setDetalhe(u)}>
                      {u.nome || "—"}
                    </button>
                  </td>
                  <td className="px-4 py-3">{u.email || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.papeis.length === 0 && <span className="text-muted-foreground text-xs">Sem papel</span>}
                      {u.papeis.map((p) => (
                        <span key={p} className={`px-2 py-0.5 rounded-full text-xs font-medium ${papelClass[p] || "bg-muted"}`}>
                          {papelLabel[p] || p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.status === "ativo" ? "bg-success/15 text-success"
                        : u.status === "pendente" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3">{u.conta_vinculada ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(u.criado_em).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDetalhe(u)}>Detalhes</Button>
                      {u.conta_vinculada && (
                        u.papeis.includes("admin") ? (
                          <Button size="sm" variant="outline" onClick={() => alternarPapel(u, "admin", false)}>
                            <ShieldOff className="w-3 h-3 mr-1" /> Revogar admin
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => alternarPapel(u, "admin", true)}>
                            <ShieldCheck className="w-3 h-3 mr-1" /> Tornar admin
                          </Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detalhe?.nome || "Usuário"}</DialogTitle>
            <DialogDescription>
              Os papéis exibidos vêm de user_roles. Alterar esta tela não burla papéis nem regras de
              acesso do banco.
            </DialogDescription>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4 text-sm">
              <section>
                <h4 className="font-semibold mb-1">Conta</h4>
                <p>E-mail: {detalhe.email || "—"}</p>
                <p>Status: {detalhe.status}</p>
                <p>Conta de acesso vinculada: {detalhe.conta_vinculada ? "Sim" : "Não (aguardando vinculação)"}</p>
              </section>
              <section>
                <h4 className="font-semibold mb-1">Papéis</h4>
                <div className="flex flex-wrap gap-1">
                  {detalhe.papeis.length === 0 ? "—" : detalhe.papeis.map((p) => (
                    <span key={p} className={`px-2 py-0.5 rounded-full text-xs font-medium ${papelClass[p] || "bg-muted"}`}>
                      {papelLabel[p] || p}
                    </span>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="font-semibold mb-1">Relacionamentos</h4>
                <p>Pets: {detalhe.pets_count}</p>
                <p>Pacientes autorizados: {detalhe.pacientes_count}</p>
                <p>TAGs: {detalhe.tags_count}</p>
              </section>
              {detalhe.veterinario_id && (
                <section>
                  <h4 className="font-semibold mb-1">Profissional</h4>
                  <p>CRMV: {detalhe.crmv || "—"} {detalhe.uf_crmv ? `/ ${detalhe.uf_crmv}` : ""}</p>
                  <p>Clínica: {detalhe.clinica || "—"}</p>
                  <p>Status profissional: {detalhe.status_profissional || "—"}</p>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsuarios;
