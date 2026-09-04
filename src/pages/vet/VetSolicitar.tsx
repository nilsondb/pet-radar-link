import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Stethoscope, CheckCircle2 } from "lucide-react";

const VetSolicitar = () => {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", crmv: "", uf_crmv: "", clinica: "", especialidade: "",
  });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.rpc("solicitar_cadastro_veterinario", {
        p_nome: form.nome.trim(),
        p_email: form.email.trim(),
        p_telefone: form.telefone.trim() || null,
        p_crmv: form.crmv.trim() || null,
        p_uf_crmv: form.uf_crmv.trim() || null,
        p_clinica: form.clinica.trim() || null,
        p_especialidade: form.especialidade.trim() || null,
      });
      if (error) throw error;
      setEnviado(true);
      toast.success("Solicitação enviada para análise da Authera.");
    } catch (err: any) {
      toast.error(err.message || "Não foi possível enviar a solicitação.");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
        <div className="pet-card w-full max-w-md text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
          <h1 className="text-2xl font-bold">Solicitação recebida</h1>
          <p className="text-sm text-muted-foreground">A Authera analisará os dados profissionais. Se aprovado, você receberá um link exclusivo para criar sua conta Authera Pet Pro.</p>
          <Link to="/vet/login"><Button variant="outline" className="w-full">Voltar para entrar</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="pet-card w-full max-w-md">
        <div className="text-center mb-6">
          <Stethoscope className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold text-primary">Solicitar Authera Pet Pro</h1>
          <p className="text-sm text-muted-foreground">O cadastro profissional é liberado somente após análise da Authera.</p>
        </div>
        <form onSubmit={enviar} className="space-y-3">
          <div><Label>Nome completo *</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>E-mail *</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CRMV</Label><Input value={form.crmv} onChange={(e) => setForm({ ...form, crmv: e.target.value })} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={form.uf_crmv} onChange={(e) => setForm({ ...form, uf_crmv: e.target.value.toUpperCase() })} /></div>
          </div>
          <div><Label>Clínica</Label><Input value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} /></div>
          <div><Label>Especialidade</Label><Input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} /></div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Solicitar análise</Button>
          <Link to="/vet/login" className="block text-center text-sm text-primary hover:underline">Já sou veterinário cadastrado</Link>
        </form>
      </div>
    </div>
  );
};

export default VetSolicitar;
