import { useEffect, useState } from "react";
import { VetLayout } from "@/components/VetLayout";
import { getVetSession } from "@/lib/vetAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const VetPerfil = () => {
  const session = getVetSession();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", crmv: "", uf_crmv: "", clinica: "", especialidade: "",
  });

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from("veterinarios")
        .select("nome, email, telefone, crmv, uf_crmv, clinica, especialidade")
        .eq("id", session.id)
        .maybeSingle();
      if (data) {
        setForm({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          crmv: data.crmv || "",
          uf_crmv: data.uf_crmv || "",
          clinica: data.clinica || "",
          especialidade: data.especialidade || "",
        });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSalvando(true);
    try {
      const { error } = await supabase.from("veterinarios").update(form).eq("id", session.id);
      if (error) throw error;
      localStorage.setItem(
        "vet_auth",
        JSON.stringify({ ...session, nome: form.nome, email: form.email, crmv: form.crmv, clinica: form.clinica })
      );
      toast.success("Perfil atualizado.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <VetLayout title="Perfil profissional">
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </VetLayout>
    );
  }

  return (
    <VetLayout title="Perfil profissional">
      <form onSubmit={salvar} className="bg-card border rounded-2xl p-5 space-y-3 max-w-xl">
        <div>
          <Label htmlFor="f-nome">Nome completo</Label>
          <Input id="f-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="f-crmv">CRMV</Label>
            <Input id="f-crmv" value={form.crmv} onChange={(e) => setForm({ ...form, crmv: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="f-uf">UF</Label>
            <Input id="f-uf" maxLength={2} value={form.uf_crmv}
              onChange={(e) => setForm({ ...form, uf_crmv: e.target.value.toUpperCase() })} />
          </div>
        </div>
        <div>
          <Label htmlFor="f-clinica">Clínica</Label>
          <Input id="f-clinica" value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="f-esp">Especialidade</Label>
          <Input id="f-esp" value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="f-tel">Telefone</Label>
          <Input id="f-tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="f-email">E-mail</Label>
          <Input id="f-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Button type="submit" disabled={salvando}>
          {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar alterações
        </Button>
      </form>
    </VetLayout>
  );
};

export default VetPerfil;
